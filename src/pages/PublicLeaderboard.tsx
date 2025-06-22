import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Medal, 
  Award, 
  Star,
  Users,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';

interface LeaderboardEntry {
  rank: number;
  affiliate_code: string;
  total_referrals: number;
  total_earnings?: number;
  conversion_rate?: number;
}

export const PublicLeaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEarnings, setShowEarnings] = useState(true);
  const [showConversion, setShowConversion] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch top 10 affiliates by earnings
        const { data, error: fetchError } = await supabase
          .from('affiliates')
          .select('affiliate_code, total_referrals, total_earnings, total_visits')
          .eq('status', 'active')
          .order('total_earnings', { ascending: false })
          .limit(10);

        if (fetchError) {
          throw fetchError;
        }

        // Calculate conversion rate and add rank
        const enrichedData = (data || []).map((affiliate, index) => {
          const conversionRate = affiliate.total_visits > 0 
            ? (affiliate.total_referrals / affiliate.total_visits) * 100 
            : 0;

          return {
            ...affiliate,
            rank: index + 1,
            conversion_rate: conversionRate
          };
        });

        setLeaderboard(enrichedData);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching public leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 2: return <Medal className="w-8 h-8 text-gray-400" />;
      case 3: return <Award className="w-8 h-8 text-amber-600" />;
      default: return <Star className="w-8 h-8 text-blue-400" />;
    }
  };

  const getRankClass = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-100 border-yellow-300 shadow-yellow-100';
      case 2: return 'bg-gray-100 border-gray-300 shadow-gray-100';
      case 3: return 'bg-amber-100 border-amber-300 shadow-amber-100';
      default: return 'bg-white border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            SaudeMAX Affiliate Leaderboard
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Celebrating our top-performing affiliates who are helping more people access quality healthcare
          </p>
        </motion.div>

        {/* Top 3 Podium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading leaderboard...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Affiliates Yet</h3>
              <p className="text-gray-600">Be the first to join our affiliate program!</p>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-8">
              {/* Second Place */}
              {leaderboard.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="order-2 md:order-1"
                >
                  <div className="relative">
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                      <Medal className="w-12 h-12 text-gray-400" />
                    </div>
                    <div className="pt-8 pb-6 px-6 bg-gray-100 border-2 border-gray-300 rounded-xl shadow-lg w-64 text-center">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl font-bold text-gray-700">2</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{leaderboard[1].affiliate_code}</h3>
                      <p className="text-gray-600 mb-2">{leaderboard[1].total_referrals} Referrals</p>
                      {showEarnings && (
                        <p className="text-lg font-semibold text-gray-800">${leaderboard[1].total_earnings?.toFixed(2)}</p>
                      )}
                      {showConversion && (
                        <p className="text-sm text-gray-600">{leaderboard[1].conversion_rate?.toFixed(1)}% Conversion</p>
                      )}
                    </div>
                    <div className="h-20 bg-gray-300 w-8 mx-auto rounded-b-lg"></div>
                  </div>
                </motion.div>
              )}

              {/* First Place */}
              {leaderboard.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="order-1 md:order-2"
                >
                  <div className="relative">
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                      <Trophy className="w-16 h-16 text-yellow-500" />
                    </div>
                    <div className="pt-10 pb-8 px-8 bg-yellow-100 border-2 border-yellow-300 rounded-xl shadow-xl w-72 text-center">
                      <div className="w-20 h-20 bg-yellow-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl font-bold text-yellow-700">1</span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{leaderboard[0].affiliate_code}</h3>
                      <p className="text-gray-600 mb-2">{leaderboard[0].total_referrals} Referrals</p>
                      {showEarnings && (
                        <p className="text-xl font-semibold text-gray-800">${leaderboard[0].total_earnings?.toFixed(2)}</p>
                      )}
                      {showConversion && (
                        <p className="text-sm text-gray-600">{leaderboard[0].conversion_rate?.toFixed(1)}% Conversion</p>
                      )}
                    </div>
                    <div className="h-24 bg-yellow-300 w-10 mx-auto rounded-b-lg"></div>
                  </div>
                </motion.div>
              )}

              {/* Third Place */}
              {leaderboard.length > 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="order-3"
                >
                  <div className="relative">
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                      <Award className="w-12 h-12 text-amber-600" />
                    </div>
                    <div className="pt-8 pb-6 px-6 bg-amber-100 border-2 border-amber-300 rounded-xl shadow-lg w-64 text-center">
                      <div className="w-16 h-16 bg-amber-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl font-bold text-amber-700">3</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{leaderboard[2].affiliate_code}</h3>
                      <p className="text-gray-600 mb-2">{leaderboard[2].total_referrals} Referrals</p>
                      {showEarnings && (
                        <p className="text-lg font-semibold text-gray-800">${leaderboard[2].total_earnings?.toFixed(2)}</p>
                      )}
                      {showConversion && (
                        <p className="text-sm text-gray-600">{leaderboard[2].conversion_rate?.toFixed(1)}% Conversion</p>
                      )}
                    </div>
                    <div className="h-16 bg-amber-300 w-8 mx-auto rounded-b-lg"></div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>

        {/* Full Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Top Performers</h2>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowEarnings(!showEarnings)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    showEarnings ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Show Earnings
                </button>
                <button
                  onClick={() => setShowConversion(!showConversion)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    showConversion ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Show Conversion
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading leaderboard...</p>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Affiliates Yet</h3>
                <p className="text-gray-600">Be the first to join our affiliate program!</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {leaderboard.slice(0, 10).map((entry, index) => (
                  <motion.div
                    key={entry.affiliate_code}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <div className={`border rounded-lg p-4 ${getRankClass(entry.rank)} shadow-md hover:shadow-lg transition-shadow`}>
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {getRankIcon(entry.rank)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-bold text-gray-900 truncate">
                            {entry.affiliate_code}
                          </p>
                          <p className="text-sm text-gray-600">
                            {entry.total_referrals} Referrals
                          </p>
                          {showEarnings && (
                            <p className="text-sm font-semibold text-gray-800">
                              ${entry.total_earnings?.toFixed(2)}
                            </p>
                          )}
                          {showConversion && (
                            <div className="flex items-center mt-1">
                              <div className="text-xs text-gray-600">
                                {entry.conversion_rate?.toFixed(1)}% Conversion
                              </div>
                              <div className="ml-2 w-16 bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-blue-600 h-1.5 rounded-full"
                                  style={{ width: `${Math.min(entry.conversion_rate || 0, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            entry.rank <= 3 ? 'bg-yellow-100' : 'bg-gray-100'
                          }`}>
                            <span className={`text-lg font-bold ${
                              entry.rank === 1 ? 'text-yellow-600' :
                              entry.rank === 2 ? 'text-gray-600' :
                              entry.rank === 3 ? 'text-amber-600' :
                              'text-blue-600'
                            }`}>
                              #{entry.rank}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Join CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12"
        >
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <div className="text-center py-8 px-4">
              <h3 className="text-2xl font-bold mb-4">Join Our Affiliate Program</h3>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                Become a SaudeMAX affiliate and earn competitive commissions while helping others access quality healthcare. Our top affiliates earn thousands in monthly commissions!
              </p>
              <Button 
                className="bg-white text-blue-700 hover:bg-blue-50"
                onClick={() => window.location.href = '/affiliate/register'}
              >
                <Users className="w-5 h-5 mr-2" />
                Become an Affiliate
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Last Updated */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Leaderboard last updated: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};