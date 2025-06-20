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
    <div className={`bg-surface-dark rounded-2xl shadow-lg p-8 border-4 ${color} flex flex-col min-h-[32rem] font-goodland`}>
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-4xl font-extrabold text-text-primary-dark tracking-wide uppercase drop-shadow-lg font-goodland">{title}</h2>
        <span className="ml-auto bg-brand-blue px-6 py-2 rounded-full text-2xl font-bold text-white shadow-lg font-goodland">
          {cars.length}
        </span>
      </div>
      {cars.length > 0 ? (
        <div className="space-y-8">
          {cars.map(car => {
            const crewNames = getCrewNames(car.crew);
            return (
              <div key={car.id} className="bg-background-dark rounded-xl p-6 border-2 border-border-dark flex flex-col gap-4 font-goodland">
                <div className="flex justify-between items-center">
                  <span className="inline-block bg-brand-blue text-white font-extrabold text-3xl px-6 py-2 rounded-xl tracking-widest shadow-md font-goodland">
                    {car.plate}
                  </span>
                  <div className="text-right">
                    <p className="text-lg text-text-secondary-dark font-semibold font-goodland">
                      {new Date(car.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-base text-text-secondary-dark mt-1 font-goodland">
                      {new Date(car.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-text-primary-dark font-bold text-2xl font-goodland">{car.model}</p>
                  <p className="text-brand-blue text-xl font-semibold font-goodland">{car.service}</p>
                  {crewNames.length > 0 && (
                    <div className="flex flex-wrap gap-2 items-center mt-2">
                      <span className="text-lg text-text-secondary-dark font-semibold font-goodland">Crew:</span>
                      {crewNames.map((name, idx) => (
                        <span key={idx} className="text-lg bg-surface-dark text-white px-4 py-1 rounded-full border border-border-dark font-bold font-goodland">
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-text-secondary-dark text-center py-12 text-2xl font-semibold font-goodland">No vehicles in this status</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background-dark flex flex-col items-center justify-start pt-8 pb-8 px-8 font-goodland">
      <header className="w-full max-w-[1920px] bg-surface-dark shadow-lg border-b-4 border-brand-blue rounded-2xl mb-8 p-6 flex items-center justify-between font-goodland">
        <div className="flex items-center gap-6">
          <img src="/Hakum V2 (OW).png" alt="Hakum Auto Care" className="h-20 w-auto drop-shadow-lg" />
          <span className="text-white text-3xl font-extrabold tracking-widest uppercase drop-shadow-lg font-goodland">Hakum Auto Care</span>
        </div>
        <div className="text-brand-blue text-2xl font-bold tracking-wide uppercase drop-shadow-lg font-goodland">
          Live Queue Status
        </div>
      </header>
      <main className="w-full max-w-[1920px] flex-1 flex flex-col justify-center font-goodland">
        <div className="grid gap-12 grid-cols-1 md:grid-cols-3">
          <ServiceSection
            title="Waiting"
            cars={groupedCars.waiting}
            color="border-brand-blue"
          />
          <ServiceSection
            title="In Progress"
            cars={groupedCars.inProgress}
            color="border-brand-cyan"
          />
          <ServiceSection
            title="Ready for Payment"
            cars={groupedCars.readyForPayment}
            color="border-brand-blue"
          />
        </div>
      </main>
    </div>
  );
};

export default CustomerView;