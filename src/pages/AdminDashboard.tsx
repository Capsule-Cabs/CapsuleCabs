
import React, { useState, useEffect } from 'react';
import { Route } from '../types/circuit.route';
import { Search, Filter, Plus, Edit3, Eye, MoreVertical, MapPin, Clock, Users, IndianRupee } from 'lucide-react';
import api from '@/services/api';
import { Navigation } from '@/components/ui/navigation';
import NewRouteModal from '../components/admin/NewRouteModal';


const AdminDashboard = () => {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [originCity, setOriginCity] = useState('');
    const [status, setStatus] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [showNewRouteModal, setShowNewRouteModal] = useState(false);
    const [newRouteForm, setNewRouteForm] = useState({
        routeCode: "",
        operator: {
            name: "",
            contactNumber: "",
            licenseNumber: "",
            rating: 4.5
        },
        origin: {
            city: "",
            location: "",
            pickupPoints: []
        },
        destination: {
            city: "",
            location: "",
            dropPoints: []
        },
        vehicle: {
            vehicleType: "",
            vehicleNumber: "",
            model: "",
            year: 2023,
            amenities: [],
            images: [],
            capacity: 6
        },
        seating: {
            layout: "1x1",
            totalSeats: 6,
            seatMap: [
                {
                    seatNumber: "A1",
                    type: "window",
                    position: { row: 1, column: 1 },
                    price: { base: 500, premium: 50 },
                    isAccessible: false,
                    isBlocked: false
                },
                {
                    seatNumber: "B1",
                    type: "window",
                    position: { row: 1, column: 2 },
                    price: { base: 450, premium: 0 },
                    isAccessible: false,
                    isBlocked: false
                },
                {
                    seatNumber: "B2",
                    type: "middle",
                    position: { row: 2, column: 1 },
                    price: { base: 450, premium: 0 },
                    isAccessible: false,
                    isBlocked: false
                },
                {
                    seatNumber: "B3",
                    type: "window",
                    position: { row: 2, column: 2 },
                    price: { base: 500, premium: 50 },
                    isAccessible: false,
                    isBlocked: false
                },
                {
                    seatNumber: "C1",
                    type: "back-seats",
                    position: { row: 3, column: 1 },
                    price: { base: 500, premium: 50 },
                    isAccessible: true,
                    isBlocked: false
                },
                {
                    seatNumber: "C2",
                    type: "back-seats",
                    position: { row: 3, column: 2 },
                    price: { base: 450, premium: 0 },
                    isAccessible: false,
                    isBlocked: false
                }
            ]
        },
        schedule: [{
            departureTime: "",
            arrivalTime: "",
            duration: 480,  // number, not string
            frequency: "daily",
            activeDays: [],
            validFrom: "2025-08-27T00:00:00.000Z",
            validUntil: "2025-12-31T00:00:00.000Z",
            isActive: true
        }],
        pricing: {
            baseFare: 500,
            currency: "INR",
            taxes: [
                {
                    name: "GST",
                    percentage: 5,
                    isApplicable: true
                },
                {
                    name: "Service Tax",
                    percentage: 2,
                    isApplicable: true
                }
            ],
            dynamicPricing: {
                enabled: true,
                peakMultiplier: 1.5,
                lowDemandMultiplier: 0.8
            },
            discounts: [
                {
                    type: "early-bird",
                    percentage: 10,
                    isActive: true
                },
                {
                    type: "student",
                    percentage: 15,
                    isActive: true
                }
            ]
        },
        policies: {
            cancellation: {
                allowCancellation: true,
                cancellationRules: [
                    {
                        timeBeforeDeparture: 48,
                        refundPercentage: 90
                    },
                    {
                        timeBeforeDeparture: 24,
                        refundPercentage: 75
                    },
                    {
                        timeBeforeDeparture: 4,
                        refundPercentage: 50
                    }
                ]
            },
            modification: {
                allowModification: true,
                modificationFee: 50
            },
            baggage: {
                allowance: "20kg",
                extraBaggageFee: 10
            }
        },
        status: "active"
    });


    const [stats, setStats] = useState({
        totalRoutes: 0,
        activeRoutes: 0,
        totalOperators: 0,
        totalCapacity: 0
    });

    useEffect(() => {
        fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        try {
            const response = await api.get('/routes/my-routes');
            console.log('Fetched routes:', response.data.data);
            const data: Route[] = await response.data.data.routes;
            setRoutes(data);
            setFilteredRoutes(data);
            calculateStats(data);
        } catch (error) {
            console.error('Failed to fetch routes:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (routesData: Route[]) => {
        const totalRoutes = routesData.length;
        const activeRoutes = routesData.filter(r => r.status === 'active').length;
        const totalOperators = new Set(routesData.map(r => r.operator.operatorId.toString())).size;
        const totalCapacity = routesData.reduce((sum, r) => sum + r?.seating.totalSeats, 0);

        setStats({ totalRoutes, activeRoutes, totalOperators, totalCapacity });
    };

    useEffect(() => {
        let filtered = routes.filter(route => {
            const matchesSearch =
                route.routeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                route.routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                route.operator.name.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesOrigin = !originCity || route.origin.city.toLowerCase().includes(originCity.toLowerCase());
            const matchesStatus = status === 'all' || route.status === status;

            return matchesSearch && matchesOrigin && matchesStatus;
        });

        setFilteredRoutes(filtered);
    }, [searchTerm, originCity, status, routes]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-lg">Loading admin dashboard...</div>
            </div>
        );
    }


    const updateFormField = (path: string, value: any) => {
        setNewRouteForm(prev => {
            const newForm = { ...prev };
            const parts = path.split('.');
            let current: any = newForm;
            for (let i = 0; i < parts.length - 1; i++) {
                current = current[parts[i]];
            }
            current[parts[parts.length - 1]] = value;
            return newForm;
        });
    };

    const addPickupPoint = () => {
        setNewRouteForm(prev => ({
            ...prev,
            origin: {
                ...prev.origin,
                pickupPoints: [...prev.origin.pickupPoints, {
                    name: "",
                    address: "",
                    landmark: "",
                    contactNumber: ""
                }]
            }
        }));
    };

    const addSchedule = () => {
        setNewRouteForm(prev => ({
            ...prev,
            schedule: [...prev.schedule, {
                departureTime: "",
                arrivalTime: "",
                duration: 480,
                frequency: "daily",
                activeDays: [],
                validFrom: new Date().toISOString(),
                validUntil: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
                isActive: true
            }]
        }));
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            {/* <div className='border-b border-white/5 bg-black/80 backdrop-blur-sm sticky top-0 z-40'>
                <Navigation />
              </div> */}
            {/* Admin Header */}
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-gray-600 mt-1">Manage routes, operators, and bookings</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() =>
                                setShowNewRouteModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                            <Plus size={18} />
                            <span>New Route</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Routes"
                        value={stats.totalRoutes.toLocaleString()}
                        icon={MapPin}
                        color="blue"
                    />
                    <StatCard
                        title="Active Routes"
                        value={stats.activeRoutes.toLocaleString()}
                        icon={Clock}
                        color="green"
                    />
                    <StatCard
                        title="Operators"
                        value={stats.totalOperators.toLocaleString()}
                        icon={Users}
                        color="purple"
                    />
                    <StatCard
                        title="Total Capacity"
                        value={stats.totalCapacity.toLocaleString()}
                        icon={IndianRupee}
                        color="orange"
                    />
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search routes, operators, cities..."
                                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center space-x-2 px-4 py-2 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50"
                            >
                                <Filter size={18} />
                                <span>Filters</span>
                            </button>
                        </div>
                    </div>

                    {showFilters && (
                        <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Origin City</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Delhi"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={originCity}
                                    onChange={(e) => setOriginCity(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="suspended">Suspended</option>
                                    <option value="under-maintenance">Under Maintenance</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setOriginCity('');
                                        setStatus('all');
                                    }}
                                    className="px-6 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                            All Routes
                            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                {filteredRoutes.length}
                            </span>
                        </h2>
                    </div>

                    {filteredRoutes.length === 0 ? (
                        <div className="text-center py-16">
                            <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No routes found</h3>
                            <p className="text-gray-500 mb-6">Try adjusting your search or filters.</p>
                            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                Create First Route
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operator</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fare</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredRoutes.map((route) => (
                                        <RouteRow key={route._id} route={route} onEdit={setSelectedRoute} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Route Edit Modal / Drawer - Opens on edit */}
            {selectedRoute && (
                <RouteEditModal
                    route={selectedRoute}
                    onClose={() => setSelectedRoute(null)}
                    onSave={fetchRoutes}
                />
            )}

            {setShowNewRouteModal && (
                <NewRouteModal
                    formData={newRouteForm}
                    onClose={() => setShowNewRouteModal(false)}
                    onSave={fetchRoutes}
                    updateFormField={updateFormField}
                    addPickupPoint={addPickupPoint}
                    addSchedule={addSchedule}
                />
            )}
        </div>
    );
};

// Stat Card Component (reused from driver dashboard styling)
const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: string; icon: any; color: string }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center">
            <div className={`p-3 rounded-lg bg-gradient-to-r ${color === 'blue' ? 'from-blue-500 to-blue-600' :
                color === 'green' ? 'from-green-500 to-green-600' :
                    color === 'purple' ? 'from-purple-500 to-purple-600' :
                        'from-orange-500 to-orange-600'} text-white mr-4`}>
                <Icon size={20} />
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500">{title}</p>
            </div>
        </div>
    </div>
);

// Route Table Row Component
const RouteRow = ({ route, onEdit }: { route: Route; onEdit: (route: Route) => void }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'inactive': return 'bg-gray-100 text-gray-800';
            case 'suspended': return 'bg-yellow-100 text-yellow-800';
            case 'under-maintenance': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap">
                <div>
                    <div className="text-sm font-medium text-gray-900">{route.routeCode}</div>
                    <div className="text-sm text-gray-500">{route.routeName}</div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{route.operator.name}</div>
                <div className="text-xs text-gray-500">{route.operator.contactNumber}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                    {route.vehicle.vehicleType} • {route.vehicle.vehicleNumber}
                </div>
                <div className="text-xs text-gray-500">{route.vehicle.model} ({route.vehicle.year})</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                {route.schedule[0] && (
                    <>
                        <div className="text-sm text-gray-900">
                            {route.schedule[0].departureTime} - {route.schedule[0].arrivalTime}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">{route.schedule[0].frequency}</div>
                    </>
                )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                    ₹{route.pricing.baseFare.toLocaleString()}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(route.status)}`}>
                    {route.status.replace('-', ' ').toUpperCase()}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button
                    onClick={() => onEdit(route)}
                    className="text-blue-600 hover:text-blue-900 p-1 -m-1 rounded"
                >
                    <Edit3 size={16} />
                </button>
                <div className="relative inline-block">
                    <MoreVertical size={16} className="text-gray-400 cursor-pointer" />
                    {/* Dropdown menu here */}
                </div>
            </td>
        </tr>
    );
};

// Route Edit Modal (placeholder - expand into wizard later)
const RouteEditModal = ({ route, onClose, onSave }: { route: Route; onClose: () => void; onSave: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Edit Route</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="mt-4 text-sm text-gray-500">
                    Route: <span className="font-semibold">{route.routeCode}</span> - {route.routeName}
                </div>
            </div>

            <div className="p-8">
                {/* Full route edit form here - 5-step wizard from previous response */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Route Basics</h3>
                        {/* Form fields for basics step */}
                        <p className="text-gray-500">Full form implementation next...</p>
                    </div>
                </div>
            </div>

            <div className="p-8 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
                <button
                    onClick={onClose}
                    className="px-6 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    onClick={onSave}
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                >
                    Save Changes
                </button>
            </div>
        </div>
    </div>
);

export default AdminDashboard;
