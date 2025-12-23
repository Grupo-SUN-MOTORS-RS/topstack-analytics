import { AdMetric, Platform } from '../types';

export const generateMockData = (): AdMetric[] => {
  const data: AdMetric[] = [];
  const platforms: Platform[] = ['google', 'meta', 'tiktok'];
  const campaigns = ['Black Friday Sale', 'Brand Awareness', 'Retargeting Q4', 'New User Promo'];
  
  const today = new Date();
  
  for (let i = 0; i < 60; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    platforms.forEach(platform => {
      campaigns.forEach((campaign, idx) => {
        const spend = Math.random() * 500 + 50;
        const roas = Math.random() * 3 + 1;
        
        data.push({
          id: `${platform}-${idx}-${i}`,
          date: dateStr,
          platform: platform,
          accountName: 'Topstack Main Account',
          campaignName: `${campaign} - ${platform.toUpperCase()}`,
          adGroupName: `AdGroup ${idx + 1}`,
          creativeName: `Creative_V${(i % 3) + 1}.jpg`,
          spend: Number(spend.toFixed(2)),
          revenue: Number((spend * roas).toFixed(2)),
          clicks: Math.floor(spend * 0.8),
          impressions: Math.floor(spend * 20),
          conversions: Math.floor(spend * 0.05)
        });
      });
    });
  }
  return data;
};