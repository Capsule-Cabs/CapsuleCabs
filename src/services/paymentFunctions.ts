import api from './api';

const verifyPaymentDetails = async (merchantOrderId: string): Promise<any | null> => {
    try {
        const response = await api.get<any>(`/phonePePayments/orderStatus/${merchantOrderId}`);
        
        if (response.data.success) {
            return response.data;
        } else {
            console.error('Payment verification failed:', response.data.message);
            return response.data;
        }
    } catch (error: any) {
        console.error('Error fetching payment details:', error?.response?.data || error.message);
        throw error; 
    }
}

export default verifyPaymentDetails;