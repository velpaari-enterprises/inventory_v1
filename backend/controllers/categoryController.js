const Category = require('../models/Category');

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ code: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new category
exports.createCategory = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    // Validate code format (must be 3 digits)
    if (!/^[0-9]{3}$/.test(code)) {
      return res.status(400).json({ message: 'Category code must be exactly 3 digits (e.g., 001, 002, 003)' });
    }

    // Check if category with same name or code exists
    const existingCategory = await Category.findOne({
      $or: [{ name: name }, { code: code }]
    });

    if (existingCategory) {
      if (existingCategory.name === name) {
        return res.status(400).json({ message: 'Category name already exists' });
      }
      if (existingCategory.code === code) {
        return res.status(400).json({ message: 'Category code already exists' });
      }
    }

    const category = new Category({
      name,
      code,
      description
    });

    const savedCategory = await category.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ 
        message: `Category ${field} '${error.keyValue[field]}' already exists` 
      });
    }
    res.status(400).json({ message: error.message });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const { name, code, description, isActive } = req.body;

    // Validate code format if provided
    if (code && !/^[0-9]{3}$/.test(code)) {
      return res.status(400).json({ message: 'Category code must be exactly 3 digits (e.g., 001, 002, 003)' });
    }

    // Check if another category with same name or code exists (excluding current category)
    if (name || code) {
      const query = {
        _id: { $ne: req.params.id }
      };

      if (name && code) {
        query.$or = [{ name }, { code }];
      } else if (name) {
        query.name = name;
      } else if (code) {
        query.code = code;
      }

      const existingCategory = await Category.findOne(query);

      if (existingCategory) {
        if (existingCategory.name === name) {
          return res.status(400).json({ message: 'Category name already exists' });
        }
        if (existingCategory.code === code) {
          return res.status(400).json({ message: 'Category code already exists' });
        }
      }
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, code, description, isActive },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ 
        message: `Category ${field} '${error.keyValue[field]}' already exists` 
      });
    }
    res.status(400).json({ message: error.message });
  }
};

// Delete category (soft delete)
exports.deleteCategory = async (req, res) => {
  try {
    const Product = require('../models/Product');
    
    // Check if any products are using this category
    const productsUsingCategory = await Product.countDocuments({ category: req.params.id });
    
    if (productsUsingCategory > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category. ${productsUsingCategory} product(s) are using this category.` 
      });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get next available category code
exports.getNextCategoryCode = async (req, res) => {
  try {
    const lastCategory = await Category.findOne({})
      .sort({ code: -1 });

    let nextCode = '001';
    if (lastCategory && lastCategory.code) {
      const lastCodeNum = parseInt(lastCategory.code, 10);
      nextCode = (lastCodeNum + 1).toString().padStart(3, '0');
    }

    res.json({ nextCode });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};