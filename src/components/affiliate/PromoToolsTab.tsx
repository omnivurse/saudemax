import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Link as LinkIcon, 
  Copy, 
  Download, 
  Image, 
  FileText, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertTriangle,
  Tag,
  QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';

interface AffiliateLink {
  id: string;
  name: string;
  referral_url: string;
  created_at: string;
}

interface PromoAsset {
  id: string;
  name: string;
  type: 'banner' | 'logo' | 'pdf';
  file_url: string;
  width: number | null;
  height: number | null;
  created_at: string;
}

interface AffiliateCoupon {
  id: string;
  code: string;
  discount_percent: number;
  status: 'active' | 'expired';
  created_at: string;
}

export const PromoToolsTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'links' | 'banners' | 'coupons'>('links');
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [assets, setAssets] = useState<PromoAsset[]>([]);
  const [coupons, setCoupons] = useState<AffiliateCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkSlug, setNewLinkSlug] = useState('');
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [copiedCouponId, setCopiedCouponId] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      if (activeTab === 'links' || activeTab === 'coupons') {
        // Fetch affiliate links
        if (activeTab === 'links') {
          const { data: linksData, error: linksError } = await supabase
            .from('affiliate_links')
            .select('*')
            .eq('affiliate_id', user.id)
            .order('created_at', { ascending: false });

          if (linksError) throw linksError;
          setLinks(linksData || []);
        }

        // Fetch affiliate coupons
        if (activeTab === 'coupons') {
          const { data: couponsData, error: couponsError } = await supabase
            .from('affiliate_coupons')
            .select('*')
            .eq('affiliate_id', user.id)
            .order('created_at', { ascending: false });

          if (couponsError) throw couponsError;
          setCoupons(couponsData || []);
        }
      }

      // Fetch promo assets
      if (activeTab === 'banners') {
        const { data: assetsData, error: assetsError } = await supabase
          .from('promo_assets')
          .select('*')
          .order('created_at', { ascending: false });

        if (assetsError) throw assetsError;
        setAssets(assetsData || []);
      }
    } catch (err: any) {
      console.error('Error fetching promo tools data:', err);
      setError(err.message || 'Failed to load promo tools');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = async () => {
    if (!newLinkName.trim() || !newLinkSlug.trim()) {
      setError('Please provide both a name and a custom slug for your link');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Create the full referral URL
      const baseUrl = 'https://joinmpb.com';
      const referralUrl = `${baseUrl}?ref=${newLinkSlug}`;

      // Insert new link
      const { data, error: insertError } = await supabase
        .from('affiliate_links')
        .insert({
          affiliate_id: user.id,
          name: newLinkName,
          referral_url: referralUrl
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Update links list
      setLinks(prev => [data, ...prev]);
      setSuccess('Referral link created successfully');
      
      // Reset form
      setNewLinkName('');
      setNewLinkSlug('');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error creating referral link:', err);
      setError(err.message || 'Failed to create referral link');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!confirm('Are you sure you want to delete this referral link?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const { error: deleteError } = await supabase
        .from('affiliate_links')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // Update links list
      setLinks(prev => prev.filter(link => link.id !== id));
      setSuccess('Referral link deleted successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error deleting referral link:', err);
      setError(err.message || 'Failed to delete referral link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (id: string, url: string) => {
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopiedLinkId(id);
        setTimeout(() => setCopiedLinkId(null), 2000);
      })
      .catch(err => {
        console.error('Failed to copy link:', err);
        setError('Failed to copy link to clipboard');
      });
  };

  const handleCopyCoupon = (id: string, code: string) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setCopiedCouponId(id);
        setTimeout(() => setCopiedCouponId(null), 2000);
      })
      .catch(err => {
        console.error('Failed to copy coupon:', err);
        setError('Failed to copy coupon code to clipboard');
      });
  };

  const handleDownloadAsset = (asset: PromoAsset) => {
    window.open(asset.file_url, '_blank');
  };

  const handleShowQRCode = (url: string) => {
    setShowQRCode(url);
  };

  return (
    <div className="space-y-6">
      {/* QR Code Modal */}
      {showQRCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md h-3/4 flex flex-col"
          >
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                QR Code for Your Link
              </h3>
              <button
                onClick={() => setShowQRCode(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row h-full overflow-hidden">
              {/* Preview Data Form */}
              <div className="w-full md:w-1/3 p-4 border-r border-gray-200 overflow-y-auto">
                <h4 className="font-medium text-gray-900 mb-4">Preview Data</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL
                    </label>
                    <input
                      type="text"
                      value={showQRCode}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button 
                    onClick={() => {
                      // Create a canvas element
                      const canvas = document.createElement("canvas");
                      const svgElement = document.querySelector("svg");
                      if (svgElement) {
                        const svgData = new XMLSerializer().serializeToString(svgElement);
                        const img = new Image();
                        img.onload = () => {
                          canvas.width = img.width;
                          canvas.height = img.height;
                          const ctx = canvas.getContext("2d");
                          if (ctx) {
                            ctx.drawImage(img, 0, 0);
                            const pngFile = canvas.toDataURL("image/png");
                            
                            // Create download link
                            const downloadLink = document.createElement("a");
                            downloadLink.download = "qrcode.png";
                            downloadLink.href = pngFile;
                            downloadLink.click();
                          }
                        };
                        img.src = "data:image/svg+xml;base64," + btoa(svgData);
                      }
                    }}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
              
              {/* QR Code Preview */}
              <div className="w-full md:w-2/3 p-4 overflow-y-auto bg-gray-50">
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm h-full overflow-y-auto flex items-center justify-center">
                  <div className="text-center">
                    <div className="bg-white p-4 rounded-lg inline-block mb-4">
                      <QRCodeSVG value={showQRCode} size={200} />
                    </div>
                    <p className="text-sm text-gray-600 mb-4 break-all px-4">{showQRCode}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Promo Tools</h2>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">{success}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="links" value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="mb-6">
          <TabsTrigger value="links">Referral Links</TabsTrigger>
          <TabsTrigger value="banners">Marketing Materials</TabsTrigger>
          <TabsTrigger value="coupons">Coupon Codes</TabsTrigger>
        </TabsList>

        {/* Referral Links Tab */}
        <TabsContent value="links">
          <div className="space-y-6">
            {/* Create New Link Form */}
            <Card className="p-6 border-blue-200 bg-blue-50">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Create Referral Link</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link Name *
                  </label>
                  <input
                    type="text"
                    value={newLinkName}
                    onChange={(e) => setNewLinkName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Facebook Campaign, Email Newsletter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Slug *
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={newLinkSlug}
                      onChange={(e) => setNewLinkSlug(e.target.value.replace(/\s+/g, ''))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., summer2025, yourname"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    This will create: https://joinmpb.com?ref=<span className="font-mono">{newLinkSlug || 'yourslug'}</span>
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button 
                  onClick={handleCreateLink}
                  disabled={loading || !newLinkName.trim() || !newLinkSlug.trim()}
                  loading={loading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Link
                </Button>
              </div>
            </Card>

            {/* Existing Links */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Links</h3>
              
              {loading && links.length === 0 ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                </div>
              ) : links.length === 0 ? (
                <div className="text-center py-8">
                  <LinkIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Referral Links</h3>
                  <p className="text-gray-600 mb-4">Create your first referral link to start tracking conversions.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {links.map((link) => {
                    const isCopied = copiedLinkId === link.id;
                    
                    return (
                      <div key={link.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="mb-3 md:mb-0">
                          <h4 className="font-medium text-gray-900">{link.name}</h4>
                          <p className="text-sm text-gray-600 break-all">{link.referral_url}</p>
                          <p className="text-xs text-gray-500">Created: {new Date(link.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCopyLink(link.id, link.referral_url)}
                          >
                            {isCopied ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy
                              </>
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleShowQRCode(link.referral_url)}
                          >
                            <QrCode className="w-4 h-4 mr-2" />
                            QR Code
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDeleteLink(link.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Tracking Info */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Referral Link Tracking</h3>
              <div className="space-y-4">
                <p className="text-blue-800">
                  Your referral links automatically track:
                </p>
                <ul className="list-disc list-inside text-blue-800 space-y-2">
                  <li>Visits to your link</li>
                  <li>Conversions (enrollments)</li>
                  <li>Commission earned</li>
                </ul>
                <p className="text-blue-800">
                  View detailed analytics in the <strong>Referral Metrics</strong> tab.
                </p>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Marketing Materials Tab */}
        <TabsContent value="banners">
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Downloadable Marketing Materials</h3>
              
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                </div>
              ) : assets.length === 0 ? (
                <div className="text-center py-8">
                  <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No Marketing Materials</h4>
                  <p className="text-gray-600">Marketing materials will be available soon.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {assets.map((asset) => (
                    <div key={asset.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {asset.type === 'banner' && (
                        <div className="aspect-video bg-gray-100 relative">
                          <img 
                            src={asset.file_url} 
                            alt={asset.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      {asset.type === 'logo' && (
                        <div className="aspect-square bg-gray-100 p-4 flex items-center justify-center">
                          <img 
                            src={asset.file_url} 
                            alt={asset.name}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      )}
                      {asset.type === 'pdf' && (
                        <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center">
                          <FileText className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                      <div className="p-4">
                        <h4 className="font-medium text-gray-900 mb-1">{asset.name}</h4>
                        <p className="text-sm text-gray-600 capitalize mb-3">
                          {asset.type} {asset.width && asset.height ? `(${asset.width}x${asset.height})` : ''}
                        </p>
                        <Button 
                          onClick={() => handleDownloadAsset(asset)}
                          className="w-full"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Usage Guidelines */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Marketing Materials Guidelines</h3>
              <div className="space-y-4">
                <p className="text-blue-800">
                  When using SaudeMAX marketing materials, please follow these guidelines:
                </p>
                <ul className="list-disc list-inside text-blue-800 space-y-2">
                  <li>Do not alter or modify the logos or banners</li>
                  <li>Always include your referral link with marketing materials</li>
                  <li>Do not make claims not supported by SaudeMAX official documentation</li>
                  <li>Respect our brand guidelines for colors and typography</li>
                </ul>
                <p className="text-blue-800">
                  For questions about usage, please contact <a href="mailto:marketing@saudemax.com" className="underline">marketing@saudemax.com</a>
                </p>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Coupon Codes Tab */}
        <TabsContent value="coupons">
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Coupon Codes</h3>
              
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                </div>
              ) : coupons.length === 0 ? (
                <div className="text-center py-8">
                  <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No Coupon Codes</h4>
                  <p className="text-gray-600 mb-4">You don't have any coupon codes yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {coupons.map((coupon) => {
                    const isCopied = copiedCouponId === coupon.id;
                    
                    return (
                      <div key={coupon.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="mb-3 md:mb-0">
                          <div className="flex items-center">
                            <h4 className="font-medium text-gray-900 mr-2">{coupon.code}</h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              coupon.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {coupon.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{coupon.discount_percent}% discount</p>
                          <p className="text-xs text-gray-500">Created: {new Date(coupon.created_at).toLocaleDateString()}</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleCopyCoupon(coupon.id, coupon.code)}
                        >
                          {isCopied ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Code
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Default Coupon */}
            <Card className="p-6 bg-green-50 border-green-200">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Tag className="w-6 h-6 text-green-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Your Default Coupon Code</h3>
                  <p className="text-green-800 mb-4">
                    Share this code with your clients to give them a 10% discount on their first month:
                  </p>
                  <div className="bg-white p-4 rounded-lg border border-green-200 flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xl font-bold text-gray-900 font-mono">AFFILIATE10</p>
                      <p className="text-sm text-gray-600">10% off first month</p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText('AFFILIATE10');
                        setSuccess('Coupon code copied to clipboard');
                        setTimeout(() => setSuccess(null), 3000);
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <p className="text-sm text-green-700">
                    This code is tracked to your affiliate account. You'll receive commission for all enrollments that use this code.
                  </p>
                </div>
              </div>
            </Card>

            {/* Coupon Usage Info */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">How Coupon Codes Work</h3>
              <div className="space-y-4">
                <p className="text-blue-800">
                  Coupon codes provide an additional way to track your referrals and offer value to potential members:
                </p>
                <ul className="list-disc list-inside text-blue-800 space-y-2">
                  <li>Members enter your coupon code during enrollment</li>
                  <li>They receive the specified discount on their first month</li>
                  <li>You receive full commission on the enrollment</li>
                  <li>Coupon usage is tracked in your Referral Metrics</li>
                </ul>
                <p className="text-blue-800">
                  For custom coupon codes or higher discount rates, please contact your account manager.
                </p>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};