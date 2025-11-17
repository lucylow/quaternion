import { useEffect, useState } from 'react';
import { Building as BuildingIcon, Clock } from 'lucide-react';

interface QueueItem {
  id: string;
  name: string;
  timeRemaining: number;
  totalTime: number;
}

interface BuildQueueProps {
  queue: QueueItem[];
  onItemComplete: (id: string) => void;
}

export const BuildQueue = ({ queue, onItemComplete }: BuildQueueProps) => {
  const [localQueue, setLocalQueue] = useState(queue);

  useEffect(() => {
    setLocalQueue(queue);
  }, [queue]);

  useEffect(() => {
    if (localQueue.length === 0) return;

    const interval = setInterval(() => {
      setLocalQueue(prev => {
        const updated = prev.map(item => ({
          ...item,
          timeRemaining: Math.max(0, item.timeRemaining - 1)
        }));

        const completed = updated.find(item => item.timeRemaining === 0);
        if (completed) {
          onItemComplete(completed.id);
          return updated.filter(item => item.id !== completed.id);
        }

        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [localQueue.length, onItemComplete]);

  if (localQueue.length === 0) {
    return (
      <div className="bg-quaternion-darker/80 backdrop-blur-sm border border-quaternion-primary/30 rounded-lg p-4">
        <h3 className="text-quaternion-primary font-bold mb-2 flex items-center gap-2">
          <BuildingIcon className="w-4 h-4" />
          Build Queue
        </h3>
        <p className="text-quaternion-light/60 text-xs">No construction in progress</p>
      </div>
    );
  }

  return (
    <div className="bg-quaternion-darker/80 backdrop-blur-sm border border-quaternion-primary/30 rounded-lg p-4">
      <h3 className="text-quaternion-primary font-bold mb-3 flex items-center gap-2">
        <BuildingIcon className="w-4 h-4" />
        Build Queue
      </h3>
      <div className="space-y-2">
        {localQueue.map((item, idx) => (
          <div key={item.id} className="bg-quaternion-dark/50 rounded p-2 border border-quaternion-primary/20">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold">{item.name}</span>
              <span className="text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {item.timeRemaining}s
              </span>
            </div>
            <div className="w-full h-1 bg-quaternion-darker rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-quaternion-primary to-quaternion-secondary transition-all duration-1000"
                style={{ width: `${((item.totalTime - item.timeRemaining) / item.totalTime) * 100}%` }}
              />
            </div>
            {idx === 0 && <span className="text-[10px] text-quaternion-secondary">Building...</span>}
          </div>
        ))}
      </div>
    </div>
  );
};
