import { format } from 'date-fns/format';
import api from './api';

const fetchRoutes = async (selectedDate: any, selectedDestination: any, selectedSource: any) => {
    try {
      const params = {
        origin: selectedSource,
        destination: selectedDestination,
        travelDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined,
      };

      const routesRes = await api.get('/routes/search', { params });
      const routes = routesRes.data.data.routes;
      return routes;

    } catch (error) {
      console.error('Failed to fetch route or availability data', error);
    }
};

export default fetchRoutes;
