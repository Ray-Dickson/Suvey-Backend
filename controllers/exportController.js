const ExcelJS = require('exceljs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const db = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');

const exportSurveyData = async (req, res) => {
    try {
        const { surveyId } = req.params;
        const { format = 'csv' } = req.query;

        // Get survey details
        const [survey] = await db.execute(
            'SELECT * FROM surveys WHERE id = ?',
            [surveyId]
        );

        if (!survey.length) {
            return res.status(404).json({ error: 'Survey not found' });
        }

        // Get questions
        const [questions] = await db.execute(
            'SELECT * FROM questions WHERE survey_id = ? ORDER BY order_index',
            [surveyId]
        );

        // Get responses
        const [responses] = await db.execute(
            'SELECT r.*, u.name as respondent_name, u.email as respondent_email FROM responses r LEFT JOIN users u ON r.user_id = u.id WHERE r.survey_id = ?',
            [surveyId]
        );

        // Get individual answers
        const [answers] = await db.execute(
            'SELECT a.*, q.question_text, q.question_type FROM answers a JOIN questions q ON a.question_id = q.id WHERE q.survey_id = ?',
            [surveyId]
        );

        if (format === 'excel') {
            return exportToExcel(res, survey[0], questions, responses, answers);
        } else {
            return exportToCSV(res, survey[0], questions, responses, answers);
        }

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Export failed' });
    }
};

const exportToCSV = (res, survey, questions, responses, answers) => {
    const csvData = [];

    // Create headers
    const headers = ['Response ID', 'Respondent Name', 'Respondent Email', 'Submitted At'];
    questions.forEach(q => {
        headers.push(`Q${q.order_index}: ${q.question_text}`);
    });

    // Process responses
    responses.forEach(response => {
        const row = {
            'Response ID': response.id,
            'Respondent Name': response.respondent_name || 'Anonymous',
            'Respondent Email': response.respondent_email || '',
            'Submitted At': response.submitted_at
        };

        // Add answers for each question
        questions.forEach(question => {
            const answer = answers.find(a => 
                a.response_id === response.id && a.question_id === question.id
            );
            row[`Q${question.order_index}: ${question.question_text}`] = 
                answer ? answer.answer_text : '';
        });

        csvData.push(row);
    });

    // Create CSV
    const csvWriter = createCsvWriter({
        path: `temp_${survey.id}_export.csv`,
        header: headers.map(h => ({ id: h, title: h }))
    });

    csvWriter.writeRecords(csvData)
        .then(() => {
            res.download(`temp_${survey.id}_export.csv`, `${survey.title}_export.csv`, (err) => {
                if (err) {
                    console.error('Download error:', err);
                }
                // Clean up temp file
                require('fs').unlink(`temp_${survey.id}_export.csv`, () => {});
            });
        })
        .catch(error => {
            console.error('CSV write error:', error);
            res.status(500).json({ error: 'CSV export failed' });
        });
};

const exportToExcel = async (res, survey, questions, responses, answers) => {
    const workbook = new ExcelJS.Workbook();

    // Create summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.addRow(['Survey Title', survey.title]);
    summarySheet.addRow(['Description', survey.description]);
    summarySheet.addRow(['Total Responses', responses.length]);
    summarySheet.addRow(['Created At', survey.created_at]);
    summarySheet.addRow(['Status', survey.status]);

    // Create responses sheet
    const responsesSheet = workbook.addWorksheet('Responses');
    
    // Add headers
    const headers = ['Response ID', 'Respondent Name', 'Respondent Email', 'Submitted At'];
    questions.forEach(q => {
        headers.push(`Q${q.order_index}: ${q.question_text}`);
    });
    responsesSheet.addRow(headers);

    // Add data rows
    responses.forEach(response => {
        const row = [
            response.id,
            response.respondent_name || 'Anonymous',
            response.respondent_email || '',
            response.submitted_at
        ];

        questions.forEach(question => {
            const answer = answers.find(a => 
                a.response_id === response.id && a.question_id === question.id
            );
            row.push(answer ? answer.answer_text : '');
        });

        responsesSheet.addRow(row);
    });

    // Style the headers
    responsesSheet.getRow(1).font = { bold: true };
    responsesSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${survey.title}_export.xlsx"`);
    res.send(buffer);
};

module.exports = { exportSurveyData };
