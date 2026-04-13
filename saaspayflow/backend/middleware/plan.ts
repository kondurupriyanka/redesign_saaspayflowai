import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService.js';

const rank: Record<string, number> = {
  free: 0,
  pro: 1,
  growth: 2,
};

export function requirePlan(minPlan: 'free' | 'pro' | 'growth') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) return res.status(401).json({ error: 'User not authenticated' });
      const user = await UserService.getUserById(req.user.id);
      const plan = user?.plan || 'free';
      if (rank[plan] < rank[minPlan]) {
        return res.status(403).json({
          error: `This feature requires ${minPlan} plan or higher`,
          currentPlan: plan,
        });
      }
      next();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
