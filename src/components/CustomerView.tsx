import React from 'react';
import { useQueue } from '../context/QueueContext';
import { Car } from '../types';

const CustomerView: React.FC = () => {
  const { cars, crews } = useQueue();

  const groupedCars = {
    waiting: cars.filter(car => car.status === 'waiting'),
    inProgress: cars.filter(car => car.status === 'in-progress'),
    readyForPayment: cars.filter(car => car.status === 'payment-pending'),
  };

  const getCrewNames = (crewIds: string[] | undefined) => {
    if (!crewIds || crewIds.length === 0) return [];
    
    return crewIds.map(crewId => {
      const crewMember = crews.find(member => member.id === crewId);
      return crewMember ? crewMember.name : 'Unknown';
    }).filter(name => name !== 'Unknown');
  };

  const ServiceSection = ({ title, cars, color }: { title: string; cars: Car[]; color: string }) => (
    <div className={`bg-black rounded-lg shadow-sm p-6 border-l-4 ${color}`}>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <span className="ml-auto bg-[#116AF8] px-3 py-1 rounded-full text-sm font-medium text-white">
          {cars.length}
        </span>
      </div>
      {cars.length > 0 ? (
        <div className="space-y-4">
          {cars.map(car => {
            const crewNames = getCrewNames(car.crew);
            
            return (
              <div key={car.id} className="bg-[#0B2699] rounded-lg p-4 transform transition-all duration-300 hover:scale-[1.02] border border-[#878EA0]">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <span className="inline-block bg-[#116AF8] text-white font-bold px-3 py-1 rounded mb-3">
                      {car.plate}
                    </span>
                    <div className="space-y-2">
                      <p className="text-white font-medium text-lg">{car.model}</p>
                      <p className="text-[#DCE3EB] text-sm">{car.service}</p>
                      {crewNames.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-[#DCE3EB] mr-1">Crew:</span>
                          {crewNames.map((name, idx) => (
                            <span key={idx} className="text-xs bg-[#878EA0] text-white px-2 py-0.5 rounded-full border border-[#DCE3EB]">
                              {name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm text-[#DCE3EB]">
                      {new Date(car.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-[#878EA0] mt-1">
                      {new Date(car.created_at).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[#DCE3EB] text-center py-4">No vehicles in this status</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-black">
      <header className="bg-black shadow-md border-b border-[#878EA0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <img src="/Hakum V2 (OW).png" alt="Hakum Auto Care" className="h-12" />
            </div>
            <div className="text-white text-sm">
              Live Queue Status
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-3">
          <ServiceSection
            title="Waiting"
            cars={groupedCars.waiting}
            color="border-[#116AF8]"
          />
          <ServiceSection
            title="In Progress"
            cars={groupedCars.inProgress}
            color="border-[#20BCED]"
          />
          <ServiceSection
            title="Ready for Payment"
            cars={groupedCars.readyForPayment}
            color="border-[#116AF8]"
          />
        </div>
      </main>
    </div>
  );
};

export default CustomerView;