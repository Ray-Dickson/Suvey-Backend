const db = require('../config/db');

const createConditionalRule = async (req, res) => {
    try {
        const { questionId, conditionType, conditionValue, targetQuestionId, action } = req.body;
        const userId = req.user.id;

        // Verify question ownership
        const [question] = await db.execute(
            'SELECT s.user_id FROM questions q JOIN surveys s ON q.survey_id = s.id WHERE q.id = ?',
            [questionId]
        );

        if (!question.length || question[0].user_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const [result] = await db.execute(
            'INSERT INTO conditional_rules (question_id, condition_type, condition_value, target_question_id, action, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [questionId, conditionType, conditionValue, targetQuestionId, action]
        );

        res.status(201).json({
            message: 'Conditional rule created successfully',
            ruleId: result.insertId
        });

    } catch (error) {
        console.error('Conditional rule creation error:', error);
        res.status(500).json({ error: 'Failed to create conditional rule' });
    }
};

const getConditionalRules = async (req, res) => {
    try {
        const { questionId } = req.params;

        const [rules] = await db.execute(
            'SELECT * FROM conditional_rules WHERE question_id = ?',
            [questionId]
        );

        res.json(rules);

    } catch (error) {
        console.error('Get conditional rules error:', error);
        res.status(500).json({ error: 'Failed to get conditional rules' });
    }
};

const updateConditionalRule = async (req, res) => {
    try {
        const { ruleId } = req.params;
        const { conditionType, conditionValue, targetQuestionId, action } = req.body;
        const userId = req.user.id;

        // Verify rule ownership
        const [rule] = await db.execute(
            'SELECT cr.*, s.user_id FROM conditional_rules cr JOIN questions q ON cr.question_id = q.id JOIN surveys s ON q.survey_id = s.id WHERE cr.id = ?',
            [ruleId]
        );

        if (!rule.length || rule[0].user_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await db.execute(
            'UPDATE conditional_rules SET condition_type = ?, condition_value = ?, target_question_id = ?, action = ? WHERE id = ?',
            [conditionType, conditionValue, targetQuestionId, action, ruleId]
        );

        res.json({ message: 'Conditional rule updated successfully' });

    } catch (error) {
        console.error('Update conditional rule error:', error);
        res.status(500).json({ error: 'Failed to update conditional rule' });
    }
};

const deleteConditionalRule = async (req, res) => {
    try {
        const { ruleId } = req.params;
        const userId = req.user.id;

        // Verify rule ownership
        const [rule] = await db.execute(
            'SELECT cr.*, s.user_id FROM conditional_rules cr JOIN questions q ON cr.question_id = q.id JOIN surveys s ON q.survey_id = s.id WHERE cr.id = ?',
            [ruleId]
        );

        if (!rule.length || rule[0].user_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await db.execute('DELETE FROM conditional_rules WHERE id = ?', [ruleId]);

        res.json({ message: 'Conditional rule deleted successfully' });

    } catch (error) {
        console.error('Delete conditional rule error:', error);
        res.status(500).json({ error: 'Failed to delete conditional rule' });
    }
};

const evaluateConditionalLogic = async (req, res) => {
    try {
        const { surveyId, responses } = req.body;

        // Get all conditional rules for the survey
        const [rules] = await db.execute(
            'SELECT cr.*, q.question_text, q.question_type FROM conditional_rules cr JOIN questions q ON cr.question_id = q.id WHERE q.survey_id = ?',
            [surveyId]
        );

        const visibleQuestions = new Set();
        const hiddenQuestions = new Set();

        // Evaluate each rule
        for (const rule of rules) {
            const response = responses.find(r => r.questionId === rule.question_id);
            
            if (response) {
                let conditionMet = false;

                switch (rule.condition_type) {
                    case 'equals':
                        conditionMet = response.answer === rule.condition_value;
                        break;
                    case 'not_equals':
                        conditionMet = response.answer !== rule.condition_value;
                        break;
                    case 'contains':
                        conditionMet = response.answer.includes(rule.condition_value);
                        break;
                    case 'greater_than':
                        conditionMet = parseFloat(response.answer) > parseFloat(rule.condition_value);
                        break;
                    case 'less_than':
                        conditionMet = parseFloat(response.answer) < parseFloat(rule.condition_value);
                        break;
                }

                if (conditionMet) {
                    if (rule.action === 'show') {
                        visibleQuestions.add(rule.target_question_id);
                    } else if (rule.action === 'hide') {
                        hiddenQuestions.add(rule.target_question_id);
                    }
                }
            }
        }

        res.json({
            visibleQuestions: Array.from(visibleQuestions),
            hiddenQuestions: Array.from(hiddenQuestions)
        });

    } catch (error) {
        console.error('Evaluate conditional logic error:', error);
        res.status(500).json({ error: 'Failed to evaluate conditional logic' });
    }
};

module.exports = {
    createConditionalRule,
    getConditionalRules,
    updateConditionalRule,
    deleteConditionalRule,
    evaluateConditionalLogic
};
