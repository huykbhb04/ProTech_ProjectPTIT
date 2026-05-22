const db = require('../config/database');

// Get all categories
exports.getAllCategories = async (req, res) => {
    try {
        const [categories] = await db.query(`
            SELECT 
                c.*,
                p.name as parent_name,
                (SELECT COUNT(*) FROM room_listings WHERE category_id = c.category_id) as listing_count
            FROM categories c
            LEFT JOIN categories p ON c.parent_id = p.category_id
            ORDER BY c.display_order ASC, c.name ASC
        `);
        res.json(categories);
    } catch (e) {
        console.error('Error fetching categories:', e);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách danh mục', error: e.message });
    }
};

// Get active categories (for public use) - with hierarchical structure
exports.getActiveCategories = async (req, res) => {
    try {
        // Get all active categories with parent info
        const [categories] = await db.query(`
            SELECT 
                c.category_id,
                c.name,
                c.slug,
                c.icon,
                c.color,
                c.description,
                c.parent_id,
                p.name as parent_name,
                (SELECT COUNT(*) FROM room_listings WHERE category_id = c.category_id AND status = 'active') as listing_count
            FROM categories c
            LEFT JOIN categories p ON c.parent_id = p.category_id
            WHERE c.is_active = 1
            ORDER BY c.parent_id IS NULL DESC, c.display_order ASC, c.name ASC
        `);

        // Organize into parent-child structure
        const mainCategories = categories.filter(c => c.parent_id === null);
        const subCategories = categories.filter(c => c.parent_id !== null);

        const structuredCategories = mainCategories.map(mainCat => ({
            ...mainCat,
            children: subCategories.filter(sub => sub.parent_id === mainCat.category_id)
        }));

        res.json(structuredCategories);
    } catch (e) {
        console.error('Error fetching active categories:', e);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách danh mục', error: e.message });
    }
};

// Get single category by ID
exports.getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const [categories] = await db.query(`
            SELECT 
                c.*,
                p.name as parent_name,
                (SELECT COUNT(*) FROM room_listings WHERE category_id = c.category_id) as listing_count
            FROM categories c
            LEFT JOIN categories p ON c.parent_id = p.category_id
            WHERE c.category_id = ?
        `, [id]);

        if (categories.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy danh mục' });
        }

        res.json(categories[0]);
    } catch (e) {
        console.error('Error fetching category:', e);
        res.status(500).json({ message: 'Lỗi khi lấy thông tin danh mục', error: e.message });
    }
};

// Create new category
exports.createCategory = async (req, res) => {
    try {
        const { name, slug, description, icon, color, parent_id, display_order } = req.body;

        if (!name || !slug) {
            return res.status(400).json({ message: 'Tên và slug là bắt buộc' });
        }

        // Check if slug already exists
        const [existing] = await db.query('SELECT category_id FROM categories WHERE slug = ?', [slug]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Slug đã tồn tại, vui lòng chọn slug khác' });
        }

        const [result] = await db.query(`
            INSERT INTO categories (name, slug, description, icon, color, parent_id, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [name, slug, description || null, icon || 'folder', color || '#6366f1', parent_id || null, display_order || 0]);

        const [newCategory] = await db.query('SELECT * FROM categories WHERE category_id = ?', [result.insertId]);
        
        console.log(`✅ Category created: ${name}`);
        res.status(201).json({ 
            message: 'Tạo danh mục thành công', 
            category: newCategory[0] 
        });
    } catch (e) {
        console.error('Error creating category:', e);
        res.status(500).json({ message: 'Lỗi khi tạo danh mục', error: e.message });
    }
};

// Update category
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, description, icon, color, parent_id, display_order, is_active } = req.body;

        // Check if category exists
        const [existing] = await db.query('SELECT * FROM categories WHERE category_id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy danh mục' });
        }

        // Check if new slug conflicts with another category
        if (slug && slug !== existing[0].slug) {
            const [slugConflict] = await db.query('SELECT category_id FROM categories WHERE slug = ? AND category_id != ?', [slug, id]);
            if (slugConflict.length > 0) {
                return res.status(400).json({ message: 'Slug đã tồn tại, vui lòng chọn slug khác' });
            }
        }

        // Prevent circular reference
        if (parent_id && parseInt(parent_id) === parseInt(id)) {
            return res.status(400).json({ message: 'Danh mục cha không thể là chính nó' });
        }

        await db.query(`
            UPDATE categories 
            SET name = COALESCE(?, name),
                slug = COALESCE(?, slug),
                description = COALESCE(?, description),
                icon = COALESCE(?, icon),
                color = COALESCE(?, color),
                parent_id = ?,
                display_order = COALESCE(?, display_order),
                is_active = COALESCE(?, is_active)
            WHERE category_id = ?
        `, [name, slug, description, icon, color, parent_id, display_order, is_active, id]);

        const [updatedCategory] = await db.query('SELECT * FROM categories WHERE category_id = ?', [id]);
        
        console.log(`✅ Category updated: ${id}`);
        res.json({ 
            message: 'Cập nhật danh mục thành công', 
            category: updatedCategory[0] 
        });
    } catch (e) {
        console.error('Error updating category:', e);
        res.status(500).json({ message: 'Lỗi khi cập nhật danh mục', error: e.message });
    }
};

// Delete category
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if category exists
        const [existing] = await db.query('SELECT * FROM categories WHERE category_id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy danh mục' });
        }

        // Check if category has listings
        const [listings] = await db.query('SELECT COUNT(*) as cnt FROM room_listings WHERE category_id = ?', [id]);
        if (listings[0].cnt > 0) {
            return res.status(400).json({ 
                message: `Danh mục này đang có ${listings[0].cnt} tin đăng. Vui lòng xóa hoặc chuyển tin đăng trước.` 
            });
        }

        // Check if category has children
        const [children] = await db.query('SELECT COUNT(*) as cnt FROM categories WHERE parent_id = ?', [id]);
        if (children[0].cnt > 0) {
            return res.status(400).json({ 
                message: `Danh mục này có ${children[0].cnt} danh mục con. Vui lòng xóa danh mục con trước.` 
            });
        }

        await db.query('DELETE FROM categories WHERE category_id = ?', [id]);
        
        console.log(`✅ Category deleted: ${id}`);
        res.json({ message: 'Xóa danh mục thành công' });
    } catch (e) {
        console.error('Error deleting category:', e);
        res.status(500).json({ message: 'Lỗi khi xóa danh mục', error: e.message });
    }
};

// Toggle category active status
exports.toggleCategoryStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.query('SELECT is_active FROM categories WHERE category_id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy danh mục' });
        }

        const newStatus = existing[0].is_active ? 0 : 1;
        await db.query('UPDATE categories SET is_active = ? WHERE category_id = ?', [newStatus, id]);
        
        console.log(`✅ Category ${id} status toggled to: ${newStatus}`);
        res.json({ 
            message: newStatus ? 'Kích hoạt danh mục thành công' : 'Vô hiệu hóa danh mục thành công',
            is_active: newStatus
        });
    } catch (e) {
        console.error('Error toggling category status:', e);
        res.status(500).json({ message: 'Lỗi khi thay đổi trạng thái', error: e.message });
    }
};
