export type BoardSpaceType =
  | 'start'
  | 'property'
  | 'utility'
  | 'industry'
  | 'tax'
  | 'card'
  | 'jail'
  | 'go_to_jail'
  | 'fine';

export interface BoardSpace {
  position: number;
  type: BoardSpaceType;
  name: string;
  propertyId?: string;
  taxAmount?: number;
}

export const BOARD: BoardSpace[] = [
  { position: 0,  type: 'start',      name: 'Mula • Start' },
  { position: 1,  type: 'property',   name: 'Kangar',            propertyId: 'kangar' },
  { position: 2,  type: 'property',   name: 'Batu Pahat',        propertyId: 'batu_pahat' },
  { position: 3,  type: 'utility',    name: 'Bekalan Air',       propertyId: 'bekalan_air' },
  { position: 4,  type: 'tax',        name: 'Cukai Pendapatan',  taxAmount: 1400 },
  { position: 5,  type: 'industry',   name: 'Automobil',         propertyId: 'automobil' },
  { position: 6,  type: 'card',       name: 'Keputusan' },
  { position: 7,  type: 'property',   name: 'Sibu',              propertyId: 'sibu' },
  { position: 8,  type: 'property',   name: 'Butterworth',       propertyId: 'butterworth' },
  { position: 9,  type: 'property',   name: 'Taiping',           propertyId: 'taiping' },
  { position: 10, type: 'jail',       name: 'Dalam Penjara / Cuma Melawat' },
  { position: 11, type: 'property',   name: 'Sandakan',          propertyId: 'sandakan' },
  { position: 12, type: 'property',   name: 'Teluk Intan',       propertyId: 'teluk_intan' },
  { position: 13, type: 'property',   name: 'Shah Alam',         propertyId: 'shah_alam' },
  { position: 14, type: 'card',       name: 'Keputusan' },
  { position: 15, type: 'industry',   name: 'Bioteknologi',      propertyId: 'bioteknologi' },
  { position: 16, type: 'card',       name: 'Keputusan' },
  { position: 17, type: 'property',   name: 'Kelang',            propertyId: 'kelang' },
  { position: 18, type: 'property',   name: 'Kuala Terengganu',  propertyId: 'kuala_terengganu' },
  { position: 19, type: 'property',   name: 'Kota Kinabalu',     propertyId: 'kota_kinabalu' },
  { position: 20, type: 'fine',       name: 'Denda',             taxAmount: 400 },
  { position: 21, type: 'property',   name: 'Kuching',           propertyId: 'kuching' },
  { position: 22, type: 'property',   name: 'Seremban',          propertyId: 'seremban' },
  { position: 23, type: 'property',   name: 'Alor Setar',        propertyId: 'alor_setar' },
  { position: 24, type: 'card',       name: 'Keputusan' },
  { position: 25, type: 'industry',   name: 'Farmaseutikal',     propertyId: 'farmaseutikal' },
  { position: 26, type: 'card',       name: 'Keputusan' },
  { position: 27, type: 'property',   name: 'Kuantan',           propertyId: 'kuantan' },
  { position: 28, type: 'property',   name: 'Kota Bharu',        propertyId: 'kota_bharu' },
  { position: 29, type: 'property',   name: 'Petaling Jaya',     propertyId: 'petaling_jaya' },
  { position: 30, type: 'go_to_jail', name: 'Masuk Penjara' },
  { position: 31, type: 'property',   name: 'Melaka',            propertyId: 'melaka' },
  { position: 32, type: 'property',   name: 'Johor Bahru',       propertyId: 'johor_bahru' },
  { position: 33, type: 'property',   name: 'Ipoh',              propertyId: 'ipoh' },
  { position: 34, type: 'card',       name: 'Keputusan' },
  { position: 35, type: 'industry',   name: 'Telekomunikasi',    propertyId: 'telekomunikasi' },
  { position: 36, type: 'tax',        name: 'Cukai Jalan',       taxAmount: 700 },
  { position: 37, type: 'utility',    name: 'Bekalan Elektrik',  propertyId: 'bekalan_elektrik' },
  { position: 38, type: 'property',   name: 'Georgetown',        propertyId: 'georgetown' },
  { position: 39, type: 'property',   name: 'Kuala Lumpur',      propertyId: 'kuala_lumpur' },
];
