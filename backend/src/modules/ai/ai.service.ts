import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const COMPANY_POLICY = `
Company Policy Document:
1. Casual Leave (CL):
   - Annual quota is 12 days.
   - Casual leaves cannot be combined with Sick Leave (SL).
   - Casual leaves do not carry forward to the next calendar year and expire on December 31st.
   - Requires manager approval but can be applied on short notice.

2. Sick Leave (SL):
   - Annual quota is 10 days.
   - Designed for personal illnesses and medical emergencies.
   - Cannot be combined with Casual Leave (CL).
   - If a sick leave exceeds 3 consecutive days, a registered medical doctor's note must be submitted upon return.

3. Earned Leave (EL) / Privilege Leave:
   - Annual quota is 15 days.
   - Can be carried forward to the next year up to a maximum cumulative limit of 30 days.
   - Applications must be submitted at least 14 days in advance.

4. Attendance & Late Policy:
   - Standard office working hours start at 09:00 AM.
   - A grace period of 15 minutes is allowed (up to 09:15 AM).
   - Checking in after 09:15 AM will flag the day as LATE.
   - Checking out with less than 4 hours (240 minutes) of worked time will flag the day as HALF_DAY.
`;

@Injectable()
export class AIService {
  constructor(private readonly prisma: PrismaService) {}

  async chat(message: string, employeeId: string) {
    // 1. Fetch live leave balances for the employee (current year)
    const year = new Date().getFullYear();
    const balances = await this.prisma.leaveBalance.findMany({
      where: { employeeId, year },
      include: { leaveType: true },
    });

    const balanceString = balances
      .map((b) => `- ${b.leaveType.name}: Allocated = ${b.allocated}, Used = ${b.used}, Available = ${Number(b.allocated) - Number(b.used)}`)
      .join('\n');

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const prompt = `You are an HR Policy Assistant for our company. Use the following Company Policy and the Employee's Live Leave Balances to answer the Employee's question. Keep answers concise, direct, and friendly.

Company Policy:
${COMPANY_POLICY}

Employee's Live Leave Balances:
${balanceString}

Employee Question: "${message}"
Answer:`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          },
        );

        if (!response.ok) {
          throw new Error(`Gemini API returned status ${response.status}`);
        }

        const json: any = await response.json();
        const responseText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (responseText) {
          return { response: responseText.trim() };
        }
      } catch (err) {
        console.error('Gemini API call failed, falling back to local responder:', err);
      }
    }

    // Local Fallback Responder
    const response = this.getFallbackResponse(message, balances);
    return { response };
  }

  private getFallbackResponse(message: string, balances: any[]) {
    const msg = message.toLowerCase();
    
    // Find balances
    const cl = balances.find((b) => b.leaveType.name.toLowerCase().includes('casual')) || { allocated: 12, used: 0 };
    const sl = balances.find((b) => b.leaveType.name.toLowerCase().includes('sick')) || { allocated: 10, used: 0 };
    const el = balances.find((b) => b.leaveType.name.toLowerCase().includes('earned')) || { allocated: 15, used: 0 };

    const clAvailable = Number(cl.allocated) - Number(cl.used);
    const slAvailable = Number(sl.allocated) - Number(sl.used);
    const elAvailable = Number(el.allocated) - Number(el.used);

    if (msg.includes('combine') && (msg.includes('casual') || msg.includes('sick'))) {
      return `According to section 1 and 2 of the company policy, **Casual Leaves cannot be combined with Sick Leaves** under any circumstances. You currently have **${clAvailable} Casual Leaves** and **${slAvailable} Sick Leaves** available.`;
    }

    if (msg.includes('casual') && (msg.includes('left') || msg.includes('balance') || msg.includes('many') || msg.includes('have'))) {
      return `You have **${clAvailable} Casual Leaves** remaining (Quota: ${cl.allocated}, Used: ${cl.used}). Please note that casual leaves do not carry forward to next year and must be used before December 31st.`;
    }

    if (msg.includes('sick') && (msg.includes('left') || msg.includes('balance') || msg.includes('many') || msg.includes('have'))) {
      return `You have **${slAvailable} Sick Leaves** remaining (Quota: ${sl.allocated}, Used: ${sl.used}). Remember that if you take a sick leave for more than 3 consecutive days, a doctor's note is required upon your return.`;
    }

    if (msg.includes('carry forward') || msg.includes('carry-forward') || msg.includes('earned')) {
      return `Only **Earned Leaves** can be carried forward, up to a maximum cumulative limit of 30 days. Casual and Sick leaves do not carry forward. You currently have **${elAvailable} Earned Leaves** remaining.`;
    }

    if (msg.includes('late') || msg.includes('grace') || msg.includes('attendance') || msg.includes('half')) {
      return `Our attendance policy states:
- Standard shift starts at **09:00 AM**.
- Grace period is **15 minutes** (up to 09:15 AM). Checking in after this flags you as **LATE**.
- Checking out with less than 4 hours (240 minutes) of worked time flags the day as **HALF_DAY**.`;
    }

    return `I can help you answer questions about company leave and attendance policies. For example:
- *Can I combine casual leave with sick leave?*
- *How many casual leaves do I have left?*
- *What is the grace period for checking in?*

Your live balances for ${new Date().getFullYear()}:
- Casual Leave: **${clAvailable} available** (Used: ${cl.used})
- Sick Leave: **${slAvailable} available** (Used: ${sl.used})
- Earned Leave: **${elAvailable} available** (Used: ${el.used})`;
  }
}
