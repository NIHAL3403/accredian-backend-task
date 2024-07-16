const express = require('express');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

// Load environment variables from .env file
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_PASS, // Your Gmail password
  },
});

// Endpoint to handle referral form submission
app.post('/api/referrals', async (req, res) => {
  const { referrerName, referrerEmail, refereeName, refereeEmail, course } = req.body;

  try {
    // Validate input
    if (!referrerName || !referrerEmail || !refereeName || !refereeEmail || !course) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Save referral to the database
    const referral = await prisma.referral.create({
      data: {
        referrerName,
        referrerEmail,
        refereeName,
        refereeEmail,
        course,
      },
    });

    // Send a referral email
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: refereeEmail,
      subject: 'Course Referral',
      text: `Hi ${refereeName},\n\nYou have been referred to the ${course} course by ${referrerName}.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ error: 'Error sending email' });
      }
      res.status(200).json({ message: 'Referral submitted successfully', referral });
    });
  } catch (error) {
    console.error('Error handling referral:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Simple route to check if the server is running
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
