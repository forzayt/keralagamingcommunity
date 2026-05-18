import { Resend } from 'resend';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // The user should ensure this variable is set in their environment/Vercel
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { YouTubeUrl } = req.body;

    if (!YouTubeUrl) {
      return res.status(400).json({ error: 'YouTube URL is required' });
    }

    const data = await resend.emails.send({
      from: 'onboarding@resend.dev', // Resend testing domain
      to: 'vishnusanthoshvr@gmail.com',
      subject: 'New Gamer Submission for Kerala Gaming Leaderboard',
      html: `<p>A new gamer has submitted their YouTube channel URL:</p><p><a href="${YouTubeUrl}">${YouTubeUrl}</a></p>`,
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
