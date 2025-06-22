import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Star, Users } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';

interface LeaderboardEntry {
  rank: number;
  affiliate_code: string;
  total_referrals: number;
  total_earnings?: number;
}

interface AffiliateLeaderboardWidgetProps {
  limit?: number;
  showEarnings?: boolean;
  className?: string;
}

export const AffiliateLeaderboardWidget: React.FC<AffiliateLeaderboardWidgetProps> = ({
  limit = 5,
  showEarnings = true,
  className = ''
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);

        // Fetch top affiliates by earnings
        const { data, error } = await supabase
          .from('affiliates')
          .select('affiliate_code, total_referrals, total_earnings')
          .eq('status', 'active')
          .order('total_earnings', { ascending: false })
          .limit(limit);

        if (error) throw error;

        // Add rank to each entry
        const rankedData = (data || []).map((affiliate, index) => ({
          ...affiliate,
          rank: index + 1
        }));

        setLeaderboard(rankedData);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [limit]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <Star className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <Card className={`${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Top Affiliates</h3>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => window.location.href = '/leaderboard'}
        >
          View All
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-6">
          <Users className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No affiliates yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <motion.div
              key={entry.affiliate_code}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getRankIcon(entry.rank)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{entry.affiliate_code}</p>
                  <p className="text-sm text-gray-600">{entry.total_referrals} referrals</p>
                </div>
              </div>
              {showEarnings && (
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${entry.total_earnings?.toFixed(2)}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200 text-center">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.location.href = '/affiliate/register'}
        >
          <Users className="w-4 h-4 mr-2" />
          Become an Affiliate
        </Button>
      </div>
    </Card>
  );
};