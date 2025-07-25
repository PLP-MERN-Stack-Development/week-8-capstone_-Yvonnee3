const { Router } = require('express');
const { 
  getBenefits, 
  createBenefit, 
  updateBenefit,
  deleteBenefit, 
  getEmployeeBenefits,
  requestBenefit,
  cancelRequest,
  getBenefitsStats
} = require('../controllers/benefitController');
// const { checkAuth, requireAdmin } = require('../middleware/authMiddleware');

const router = Router();

// Admin-only routes
router.get('/',  getBenefits);
router.post('/',  createBenefit);
router.put('/:id',  updateBenefit);
router.delete('/:id', deleteBenefit);
router.get('/stats', getBenefitsStats);


// Employee routes
router.get('/employee', getEmployeeBenefits);


module.exports = router;