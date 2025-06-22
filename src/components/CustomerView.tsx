import React, { useState, useEffect } from 'react';
import { useQueue } from '../context/QueueContext';
import { useTheme } from '../context/ThemeContext';
import { Car } from '../types';

const CustomerView: React.FC = () => {
  const { cars, crews } = useQueue();
  const { theme, toggleTheme } = useTheme();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000); // Update every second
    return () => clearInterval(timer);
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysCars = cars.filter(car => {
    const carDate = new Date(car.created_at);
    return carDate >= today;
  });

  const groupedCars = {
    waiting: todaysCars.filter(car => car.status === 'waiting'),
    inProgress: todaysCars.filter(car => car.status === 'in-progress'),
    readyForPayment: todaysCars.filter(car => car.status === 'payment-pending'),
  };

  const maxItems = Math.max(
    groupedCars.waiting.length,
    groupedCars.inProgress.length,
    groupedCars.readyForPayment.length
  );

  const getCrewNames = (crewIds: string[] | undefined) => {
    if (!crewIds || crewIds.length === 0) return [];
    
    return crewIds.map(crewId => {
      const crewMember = crews.find(member => member.id === crewId);
      return crewMember ? crewMember.name : 'Unknown';
    }).filter(name => name !== 'Unknown');
  };

  const ServiceSection = ({ title, cars, color, maxItems }: { title: string; cars: Car[]; color:string; maxItems: number }) => {
    const isCrowded = maxItems > 5;

    return (
      <div className={`bg-surface-light dark:bg-[#1A1A1A] rounded-lg shadow-xl flex flex-col h-full`}>
        <div className={`flex items-center justify-between p-3 border-b-4 ${color}`}>
          <h2 className="text-2xl font-bold text-text-primary-light dark:text-white uppercase tracking-wider">{title}</h2>
          <span className="bg-text-primary-light dark:bg-white text-background-light dark:text-black text-xl font-bold px-3 py-0.5 rounded-full">{cars.length}</span>
        </div>
        
        {cars.length > 0 ? (
          <div className="flex-1 overflow-hidden p-2">
            <div className="flex flex-col h-full gap-2">
              {cars.map(car => {
                const crewNames = getCrewNames(car.crew);
                return (
                  <div key={car.id} className={`bg-background-light dark:bg-[#2C2C2E] rounded-lg flex justify-between items-center flex-1 min-h-0 ${isCrowded ? 'p-2' : 'p-3'}`}>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold tracking-wider text-text-primary-light dark:text-gray-100 ${isCrowded ? 'text-xl' : 'text-2xl'}`}>{car.plate}</p>
                      <p className={`font-semibold mt-1 truncate ${isCrowded ? 'text-sm text-text-secondary-light dark:text-gray-300' : 'text-base text-text-secondary-light dark:text-gray-300'}`}>{car.model}</p>
                      <p 
                        className={`font-medium text-brand-blue dark:text-brand-cyan truncate ${isCrowded ? 'text-xs' : 'text-sm'}`}
                        title={car.service}
                      >
                        {car.service}
                      </p>
                      {crewNames.length > 0 && (
                        <div className={`flex items-center gap-1.5 flex-wrap ${isCrowded ? 'mt-1' : 'mt-2'}`}>
                          {crewNames.map((name, idx) => (
                            <span 
                              key={idx} 
                              className={`bg-surface-light dark:bg-gray-600 text-text-secondary-light dark:text-white rounded-full font-medium truncate ${isCrowded ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5'}`}
                              title={name}
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 pl-3">
                      <p className={`font-mono font-semibold text-text-secondary-light dark:text-gray-200 ${isCrowded ? 'text-xl' : 'text-2xl'}`}>
                        {new Date(car.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
              <p className="text-text-secondary-light dark:text-gray-500 text-center text-lg font-medium">No vehicles here</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen bg-background-light dark:bg-black flex flex-col items-center p-3 font-sans overflow-hidden">
      <header className="w-full max-w-7xl bg-transparent mb-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="transition-transform duration-300 ease-in-out hover:scale-105" title="Toggle Theme">
            <img 
              src={theme === 'dark' ? "/Hakum V2 (OW).png" : "/Hakum V2 (Blue).png"} 
              alt="Hakum Auto Care" 
              className="h-14 w-auto" 
            />
          </button>
          <span className="text-text-primary-light dark:text-white text-3xl font-bold tracking-wide uppercase">Hakum Auto Care</span>
        </div>
        <div className="text-right">
          <div className="text-brand-blue text-2xl font-bold tracking-wider uppercase">
            Live Queue
          </div>
          <div className="text-text-primary-light dark:text-white text-lg font-medium">
            {currentDateTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {' | '}
            {currentDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      </header>
      
      <main className="w-full max-w-7xl flex-1">
        <div className="grid gap-3 grid-cols-1 md:grid-cols-3 h-full">
          <ServiceSection
            title="Waiting"
            cars={groupedCars.waiting}
            color="border-brand-blue"
            maxItems={maxItems}
          />
          <ServiceSection
            title="In Progress"
            cars={groupedCars.inProgress}
            color="border-brand-cyan"
            maxItems={maxItems}
          />
          <ServiceSection
            title="Ready for Payment"
            cars={groupedCars.readyForPayment}
            color="border-yellow-400"
            maxItems={maxItems}
          />
        </div>
      </main>
    </div>
  );
};

export default CustomerView;