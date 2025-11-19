export async function sendTokenEmail(to, name, token, collegeName) {
  try {
    const templateParams = {
      to_email: to,
      to_name: name,
      college_name: collegeName,
      token: token,
      feedback_url: `${process.env.NEXT_PUBLIC_APP_URL}/student/login?token=${token}`,
      student_name: name,
    };

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        template_params: templateParams,
      }),
    });

    if (!response.ok) {
      throw new Error('Email sending failed');
    }

    return { success: true };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendBulkTokens(students, collegeName) {
  const results = [];
  
  for (const student of students) {
    const result = await sendTokenEmail(
      student.email,
      student.name,
      student.token,
      collegeName
    );
    results.push({ ...student, emailSent: result.success });
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}
