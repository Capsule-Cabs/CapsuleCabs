import api from './api';

/**
 * Unified Payment Service
 * Handles: 
 * 1. PhonePe Status Polling (GET)
 * 2. Zoho Status Polling (GET)
 * 3. Zoho Signature Verification (POST)
 */
const verifyPaymentDetails = async (
    orderId: string, 
    gateway: 'PHONEPE' | 'ZOHO',
    zohoVerification?: { 
        payments_session_id: string; 
        signature: string 
    }
): Promise<any | null> => {
    try {
        // SCENARIO 1: Zoho Signature Verification (Initial Handshake)
        // If zohoVerification data is passed, we trigger the POST verification
        if (gateway === 'ZOHO' && zohoVerification) {
            const response = await api.post('/zohoPayments/verify-payment', {
                payment_id: orderId,
                payments_session_id: zohoVerification.payments_session_id,
                signature: zohoVerification.signature
            });
            return response.data;
        }

        // SCENARIO 2: Status Polling (GET)
        // Used by PaymentStatus.tsx to check the final outcome
        const endpoint = gateway === 'ZOHO' 
            ? `/zohoPayments/status/${orderId}` 
            : `/phonePePayments/orderStatus/${orderId}`;
            
        const response = await api.get<any>(endpoint);
        
        // Normalize response to ensure .data is always available to the caller
        return response.data;

    } catch (error: any) {
        const errorMsg = error?.response?.data?.message || error.message;
        console.error(`[PaymentService] ${gateway} Error:`, errorMsg);
        throw error; 
    }
}

export default verifyPaymentDetails;