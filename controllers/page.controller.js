const Page = require('../models/page.model');

exports.addPage = async (req, res) => {
    try {
        const { title, slug, content } = req.body;
        const page = new Page({
            title,
            slug,
            content,
            createdBy: req.user._id
        });
        await page.save();
        res.status(201).json({ success: true, page });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error adding page', error: error.message });
    }
};

exports.getPages = async (req, res) => {
    try {
        const pages = await Page.find({ isActive: true }).select('-__v');
        res.json({ success: true, pages });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching pages', error: error.message });
    }
};

exports.getPageBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const page = await Page.findOne({ slug, isActive: true }).select('-__v');
        if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
        res.json({ success: true, page });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching page', error: error.message });
    }
};

exports.updatePage = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, slug, content, isActive } = req.body;
        const page = await Page.findByIdAndUpdate(
            id,
            { title, slug, content, isActive },
            { new: true }
        );
        if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
        res.json({ success: true, page });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating page', error: error.message });
    }
};

exports.deletePage = async (req, res) => {
    try {
        const { id } = req.params;
        const page = await Page.findByIdAndDelete(id);
        if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
        res.json({ success: true, message: 'Page deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting page', error: error.message });
    }
}; 