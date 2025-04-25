import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { OpenAI } from 'openai';
import multer from 'multer';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import fs from 'fs';
import path from 'path';
import type { Request } from 'express';
import type { FileFilterCallback } from 'multer';

config(); // Load .env
const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowed = ['.doc', '.docx', '.pdf', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only doc, docx, pdf, txt files are allowed'));
  }
});

app.post('/api/simplify', async (req, res) => {
  const { text } = req.body;

  try {
    const prompt = `
You are a legal assistant. Read the following contract and summarize it in plain English.

Return your answer in 3 sections:
1. Overview: What is this contract about?
2. Key Obligations: What does the user have to do?
3. Risks/Red Flags: Anything important to be aware of?

Contract:
${text}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const result = response.choices[0].message.content;
    res.json({ summary: result });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to simplify contract' });
  }
});

app.post('/api/upload', upload.single('file'), async (req: Request, res) => {
  const file = req.file as Express.Multer.File | undefined;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });
  const ext = path.extname(file.originalname).toLowerCase();
  const filePath = file.path;
  try {
    let text = '';
    if (ext === '.txt') {
      text = fs.readFileSync(filePath, 'utf8');
    } else if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
    } else if (ext === '.pdf') {
      const data = fs.readFileSync(filePath);
      const result = await pdfParse(data);
      text = result.text;
    } else if (ext === '.doc') {
      // .doc not natively supported, return error for now
      return res.status(415).json({ error: '.doc not supported yet' });
    }
    fs.unlinkSync(filePath); // Clean up
    res.json({ text });
  } catch (err: any) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ error: err.message || 'Failed to extract text' });
  }
});

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
