import { config, plans } from './config.js';
export function paymentInstructions(planId,orderId){
 if(!plans[planId]||planId==='free') throw new Error('invalid_plan');
 return {method:'bit_manual',priceNis:plans[planId].price,phone:config.bitPhone,verifiedUrl:config.bitUrl||null,orderNote:orderId,message:'התשלום באמצעות bit נבדק ידנית. הגישה תופעל לאחר אישור ההעברה.'};
}
