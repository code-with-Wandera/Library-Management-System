
export const calculateFineUI = (dueDate) => {
  if (!dueDate) return 0;
  
  const now = new Date();
  const due = new Date(dueDate);
  
  // 1. Define the 21-day Grace Period
  const gracePeriodMS = 21 * 24 * 60 * 60 * 1000;
  const fineStartsAt = due.getTime() + gracePeriodMS;

  if (now.getTime() > fineStartsAt) {
    const diffTime = now.getTime() - fineStartsAt;
    const totalDaysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    // 2. $1 every 2 days
    return Math.ceil(totalDaysOverdue / 2);
  }
  
  return 0; 
};