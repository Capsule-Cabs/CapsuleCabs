import axios from 'axios';
import config from '../config/config.js';

const FAST2SMS_URL = 'https://www.fast2sms.com/dev/bulkV2';

class SmsService {

  async sendOTP(mobileNumber, otp) {
    try {
      const payload = {
        sender_id: config.otp_key,
        message: config.otp_value,
        language: 'english',
        route: 'dlt',
        numbers: mobileNumber,
        variables: otp,
        variables_values: otp,
        flash: 0
      };

      const response = await axios.post(
        FAST2SMS_URL,
        payload,
        {
          headers: {
            Authorization: config.sms_api_key,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;

    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async sendTripConfirmation({ sourceCity, destinationCity, webLink, supportNumber, customerNumber }) {
    try {
      const payload = {
        sender_id: config.trip_confirm_key,
        message: config.trip_confirm_value,
        language: 'english',
        route: 'dlt',
        numbers: customerNumber,
        variables: '{#AA#}|{#BB#}|{#CC#}|{#DD#}',
        variables_values: `${sourceCity}|${destinationCity}|${webLink}|${supportNumber}`,
        flash: 1
      };

      const response = await axios.post(
        FAST2SMS_URL,
        payload,
        {
          headers: {
            Authorization: config.sms_api_key,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;

    } catch (error) {
      throw error.response?.data || error;
    }
  }

  
}

export default new SmsService();