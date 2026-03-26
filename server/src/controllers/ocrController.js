const axios = require('axios');
const FormData = require('form-data');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

exports.processCCCD = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Vui lòng cung cấp ảnh CCCD.' });
        }

        const formData = new FormData();
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });

        const response = await axios.post(`${AI_SERVICE_URL}/ocr/cccd`, formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });

        res.json(response.data);
    } catch (error) {
        console.error("AI Service Error (CCCD):", error.response?.data || error.message);
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Lỗi khi xử lý AI OCR cho CCCD.';
        res.status(status).json({ message, error: error.message, details: error.response?.data });
    }
};

exports.processMeter = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Vui lòng cung cấp ảnh đồng hồ.' });
        }

        const { previousValue } = req.body;

        const formData = new FormData();
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });
        formData.append('previous_value', previousValue || 0);

        const response = await axios.post(`${AI_SERVICE_URL}/ocr/meter`, formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });

        res.json(response.data);
    } catch (error) {
        console.error("AI Service Error (Meter):", error.response?.data || error.message);
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Lỗi khi xử lý AI OCR cho đồng hồ.';
        res.status(status).json({ message, error: error.message, details: error.response?.data });
    }
};
