import React from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';
interface NewRouteForm {
  routeCode: string;
  operator: { name: string; contactNumber: string; licenseNumber: string; rating: number };
  origin: { city: string; location: string; pickupPoints: Array<{name: string; address: string; landmark: string; contactNumber: string}> };
  destination: { city: string; location: string; dropPoints: Array<{name: string; address: string; landmark: string; contactNumber: string}> };
  vehicle: { vehicleType: string; vehicleNumber: string; model: string; year: number; amenities: string[]; images: string[]; capacity: number };
  seating: any;  // constant
  schedule: Array<{
    departureTime: string;
    arrivalTime: string;
    duration: number;
    frequency: string;
    activeDays: string[];
    validFrom: string;
    validUntil: string;
    isActive: boolean;
  }>;
  pricing: any;  // partially editable
  policies: any;  // constant
  status: string;
}

interface NewRouteModalProps {
  formData: NewRouteForm;
  onClose: () => void;
  onSave: () => void;
  updateFormField: (path: string, value: any) => void;
  addPickupPoint: () => void;
  addSchedule: () => void;
}

const NewRouteModal: React.FC<NewRouteModalProps> = ({
  formData,
  onClose,
  onSave,
  updateFormField,
  addPickupPoint,
  addSchedule
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await api.post('/api/v1/routes/', formData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to create route', error);
      alert('Failed to create route. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
        <div className="p-8 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">New Route</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Operator */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Operator Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input 
                type="text" 
                placeholder="Operator Name" 
                value={formData.operator.name}
                onChange={(e) => updateFormField('operator.name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input 
                type="tel" 
                placeholder="Contact Number" 
                value={formData.operator.contactNumber}
                onChange={(e) => updateFormField('operator.contactNumber', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input 
                type="text" 
                placeholder="License Number" 
                value={formData.operator.licenseNumber}
                onChange={(e) => updateFormField('operator.licenseNumber', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input 
                type="number" 
                step="0.1" 
                placeholder="Rating" 
                value={formData.operator.rating}
                onChange={(e) => updateFormField('operator.rating', parseFloat(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Continue with other sections using same pattern */}
          {/* Origin, Destination, Vehicle, Schedule, Pricing with connected inputs */}

          <div className="p-8 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3 pt-8">
            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
              Create Route
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewRouteModal;
