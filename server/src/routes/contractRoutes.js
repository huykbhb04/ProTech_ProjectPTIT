const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const { protect, landlordOnly } = require('../middleware/authMiddleware');
const { uploadMultiple } = require('../middleware/uploadMiddleware');

router.get('/landlord/list', protect, landlordOnly, contractController.getLandlordContracts);
router.post('/create', protect, contractController.createContractFromBooking);
router.get('/:id', protect, contractController.getContractDetail);
router.put('/:id/terms', protect, landlordOnly, contractController.updateContractTerms);
router.put('/:id/cccd', protect, uploadMultiple.fields([{ name: 'front', maxCount: 1 }, { name: 'back', maxCount: 1 }]), contractController.uploadTenantCCCD);
router.put('/:id/landlord-cccd', protect, landlordOnly, uploadMultiple.fields([{ name: 'front', maxCount: 1 }, { name: 'back', maxCount: 1 }]), contractController.uploadLandlordCCCD);
router.put('/:id/personal-info', protect, contractController.updateTenantInfo);
router.put('/:id/tenant-sign', protect, contractController.tenantSignContract);
router.put('/:id/landlord-sign', protect, landlordOnly, contractController.landlordSignContract);
router.put('/:id/landlord-reject', protect, landlordOnly, contractController.landlordRejectContract);
router.put('/:id/landlord-cancel', protect, landlordOnly, contractController.landlordCancelContract);

// Handover routes
router.put('/:id/handover', protect, landlordOnly, contractController.saveContractHandover);
router.get('/:id/assets', protect, contractController.getRoomAssets);
router.get('/:id/utility-configs', protect, contractController.getUtilityConfigs);

module.exports = router;
