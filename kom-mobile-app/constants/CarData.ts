export const CarBrands = [
  {
    id: 'all',
    name: 'All',
    nameAr: 'الكل',
    logo: 'https://cdn-icons-png.flaticon.com/512/741/741407.png',
    models: []
  },
  {
    id: 'toyota',
    name: 'Toyota',
    nameAr: 'تويوتا',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Toyota.svg/1200px-Toyota.svg.png',
    models: [
        { en: 'Camry', ar: 'كامري' },
        { en: 'Corolla', ar: 'كورولا' },
        { en: 'Land Cruiser', ar: 'لاند كروزر' },
        { en: 'Hilux', ar: 'هايلكس' },
        { en: 'Yaris', ar: 'يارس' },
        { en: 'Avalon', ar: 'أفالون' },
        { en: 'RAV4', ar: 'راف فور' },
        { en: 'Prado', ar: 'برادو' },
        { en: 'Fortuner', ar: 'فورتشنر' },
        { en: 'Supra', ar: 'سوبرا' },
        { en: 'Sequoia', ar: 'سيكويا' },
        { en: 'Highlander', ar: 'هايلاندر' },
        { en: 'Innova', ar: 'إنوفا' },
        { en: 'FJ Cruiser', ar: 'إف جي' }
    ]
  },
  {
    id: 'nissan',
    name: 'Nissan',
    nameAr: 'نيسان',
    logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/nissan.png',
    models: [
        { en: 'Patrol', ar: 'باترول' },
        { en: 'Altima', ar: 'ألتيما' },
        { en: 'Sunny', ar: 'صني' },
        { en: 'Maxima', ar: 'ماكسيما' },
        { en: 'X-Trail', ar: 'إكس تريل' },
        { en: 'Kicks', ar: 'كيكس' },
        { en: 'Pathfinder', ar: 'باثفندر' },
        { en: 'GT-R', ar: 'جي تي آر' },
        { en: 'Z', ar: 'زد' },
        { en: 'Juke', ar: 'جوك' },
        { en: 'Sentra', ar: 'سنترا' },
        { en: 'Armada', ar: 'أرمادا' },
        { en: 'Urvan', ar: 'أورفان' }
    ]
  },
  {
    id: 'honda',
    name: 'Honda',
    nameAr: 'هوندا',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Honda.svg/1200px-Honda.svg.png',
    models: [
        { en: 'Accord', ar: 'أكورد' },
        { en: 'Civic', ar: 'سيفيك' },
        { en: 'CR-V', ar: 'سي آر في' },
        { en: 'Pilot', ar: 'بايلوت' },
        { en: 'City', ar: 'سيتي' },
        { en: 'Odyssey', ar: 'أوديسي' },
        { en: 'HR-V', ar: 'إتش آر في' },
        { en: 'Jazz', ar: 'جاز' },
        { en: 'ZR-V', ar: 'زد آر في' }
    ]
  },
  {
    id: 'ford',
    name: 'Ford',
    nameAr: 'فورد',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Ford_logo_flat.svg/1200px-Ford_logo_flat.svg.png',
    models: ['Mustang', 'F-150', 'Explorer', 'Expedition', 'Taurus', 'Edge', 'Ranger', 'Bronco', 'Territory', 'Everest', 'Focus']
  },
  {
    id: 'chevrolet',
    name: 'Chevrolet',
    nameAr: 'شيفروليه',
    logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/chevrolet.png',
    models: ['Tahoe', 'Suburban', 'Camaro', 'Corvette', 'Silverado', 'Malibu', 'Traverse', 'Captiva', 'Groove', 'Blazer']
  },
  {
    id: 'gmc',
    name: 'GMC',
    nameAr: 'جي إم سي',
    logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/gmc.png',
    models: ['Yukon', 'Sierra', 'Terrain', 'Acadia', 'Savana']
  },
  {
    id: 'mercedes',
    name: 'Mercedes-Benz',
    nameAr: 'مرسيدس',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Mercedes-Benz_Star_2022.svg/2048px-Mercedes-Benz_Star_2022.svg.png',
    models: ['S-Class', 'E-Class', 'C-Class', 'G-Class', 'GLE', 'GLC', 'A-Class', 'CLA', 'CLS', 'GLS', 'G-Wagon', 'AMG GT']
  },
  {
    id: 'bmw',
    name: 'BMW',
    nameAr: 'بي إم دبليو',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/BMW.svg/2048px-BMW.svg.png',
    models: ['7 Series', '5 Series', '3 Series', 'X5', 'X6', 'X7', 'X3', 'M4', 'M3', 'M5', 'X1', 'X2', 'Z4']
  },
  {
    id: 'lexus',
    name: 'Lexus',
    nameAr: 'لكزس',
    logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/lexus.png',
    models: ['LX', 'ES', 'LS', 'IS', 'RX', 'GX', 'NX', 'UX', 'RC', 'LC']
  },
  {
    id: 'hyundai',
    name: 'Hyundai',
    nameAr: 'هيونداي',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Hyundai_Motor_Company_logo.svg/1200px-Hyundai_Motor_Company_logo.svg.png',
    models: ['Sonata', 'Elantra', 'Tucson', 'Santa Fe', 'Accent', 'Azera', 'Creta', 'Palisade', 'Kona', 'Veloster', 'Staria']
  },
  {
    id: 'kia',
    name: 'Kia',
    nameAr: 'كيا',
    logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/kia.png',
    models: ['K5', 'Sportage', 'Sorento', 'Telluride', 'Rio', 'Cerato', 'Pegas', 'Seltos', 'Carnival', 'Stinger', 'Sonet']
  },
  {
    id: 'mazda',
    name: 'Mazda',
    nameAr: 'مازدا',
    logo: 'https://www.carlogos.org/car-logos/mazda-logo-2018.png',
    models: ['Mazda 6', 'Mazda 3', 'CX-9', 'CX-5', 'CX-30', 'MX-5']
  },
  {
    id: 'mitsubishi',
    name: 'Mitsubishi',
    nameAr: 'ميتسوبيشي',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Mitsubishi_logo.svg/2048px-Mitsubishi_logo.svg.png',
    models: ['Pajero', 'Lancer', 'Outlander', 'ASX', 'Eclipse Cross', 'L200', 'Attrage', 'Mirage', 'Montero Sport']
  },
  {
    id: 'landrover',
    name: 'Land Rover',
    nameAr: 'لاند روفر',
    logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/land-rover.png',
    models: ['Range Rover', 'Defender', 'Range Rover Sport', 'Evoque', 'Velar', 'Discovery']
  },
  {
    id: 'porsche',
    name: 'Porsche',
    nameAr: 'بورش',
    logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/porsche.png',
    models: ['911', 'Cayenne', 'Panamera', 'Macan', 'Taycan', '718 Boxster', '718 Cayman']
  },
  {
    id: 'audi',
    name: 'Audi',
    nameAr: 'أودي',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Audi_logo_detail.svg/2560px-Audi_logo_detail.svg.png',
    models: ['A8', 'A6', 'A4', 'Q7', 'Q8', 'Q5', 'Q3', 'RS Q8', 'R8', 'e-tron']
  },
  {
    id: 'volkswagen',
    name: 'Volkswagen',
    nameAr: 'فولكس واجن',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Volkswagen_Logo_till_1995.svg/2048px-Volkswagen_Logo_till_1995.svg.png',
    models: ['Touareg', 'Tiguan', 'Teramont', 'Passat', 'Golf', 'Jetta', 'T-Roc']
  },
  {
    id: 'dodge',
    name: 'Dodge',
    nameAr: 'دودج',
    logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/dodge.png',
    models: ['Charger', 'Challenger', 'Durango', 'Ram']
  },
  {
    id: 'jeep',
    name: 'Jeep',
    nameAr: 'جيب',
    logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/jeep.png',
    models: ['Wrangler', 'Grand Cherokee', 'Cherokee', 'Compass', 'Gladiator', 'Renegade']
  },
  {
    id: 'cadillac',
    name: 'Cadillac',
    nameAr: 'كاديلاك',
    logo: 'https://www.carlogos.org/car-logos/cadillac-logo-2014.png',
    models: ['Escalade', 'CT5', 'CT4', 'XT6', 'XT5', 'XT4']
  },
  {
    id: 'genesis',
    name: 'Genesis',
    nameAr: 'جينيسيس',
    logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/genesis.png',
    models: ['G90', 'G80', 'G70', 'GV80', 'GV70']
  },
  {
    id: 'mg',
    name: 'MG',
    nameAr: 'إم جي',
    logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/mg.png',
    models: ['MG HS', 'MG RX5', 'MG ZS', 'MG 6', 'MG 5', 'MG GT', 'MG One']
  },
  {
    id: 'geely',
    name: 'Geely',
    nameAr: 'جيلي',
    logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/geely.png',
    models: ['Coolray', 'Tugella', 'Monjaro', 'Azkarra', 'Emgrand']
  },
  {
    id: 'changan',
    name: 'Changan',
    nameAr: 'شانجان',
    logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/changan.png',
    models: ['CS95', 'CS85', 'CS75', 'CS35', 'Eado Plus', 'UNI-K', 'UNI-V', 'UNI-T']
  },
  {
    id: 'haval',
    name: 'Haval',
    nameAr: 'هافال',
    logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/haval.png',
    models: ['H6', 'Jolion', 'H9', 'Dargo']
  },
  {
    id: 'chery',
    name: 'Chery',
    nameAr: 'شيري',
    logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/chery.png',
    models: ['Tiggo 8 Pro', 'Tiggo 7 Pro', 'Tiggo 4 Pro', 'Arrizo 6']
  },
  {
    id: 'suzuki',
    name: 'Suzuki',
    nameAr: 'سوزوكي',
    logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/suzuki.png',
    models: ['Jimny', 'Swift', 'Vitara', 'Dzire', 'Baleno', 'Ertiga']
  },
  {
    id: 'infiniti',
    name: 'Infiniti',
    nameAr: 'إنفينيتي',
    logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/infiniti.png',
    models: ['QX80', 'QX60', 'QX50', 'QX55', 'Q50']
  },
  {
    id: 'tesla',
    name: 'Tesla',
    nameAr: 'تسلا',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Tesla_Motors.svg/1200px-Tesla_Motors.svg.png',
    models: ['Model S', 'Model 3', 'Model X', 'Model Y']
  }
];

export const MotorcycleBrands = [
  {
    id: 'all',
    name: 'All',
    nameAr: 'الكل',
    logo: 'https://cdn-icons-png.flaticon.com/512/2921/2921222.png',
    models: []
  },
  {
    id: 'honda',
    name: 'Honda',
    nameAr: 'هوندا',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Honda.svg/1200px-Honda.svg.png',
    models: ['CBR', 'Gold Wing', 'Africa Twin', 'Forza', 'PCX', 'Rebel', 'Grom']
  },
  {
    id: 'yamaha',
    name: 'Yamaha',
    nameAr: 'ياماها',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Yamaha_Motor_Logo_%28full%29.svg/1280px-Yamaha_Motor_Logo_%28full%29.svg.png',
    models: ['R1', 'R6', 'R7', 'MT-09', 'MT-07', 'TMAX', 'NMAX', 'R3']
  },
  {
    id: 'kawasaki',
    name: 'Kawasaki',
    nameAr: 'كاواساكي',
    logo: 'https://www.carlogos.org/car-logos/kawasaki-logo-2015-black.png',
    models: ['Ninja ZX-10R', 'Ninja H2', 'Z900', 'Z650', 'Versys', 'KLR 650']
  },
  {
    id: 'suzuki',
    name: 'Suzuki',
    nameAr: 'سوزوكي',
    logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/suzuki.png',
    models: ['Hayabusa', 'GSX-R1000', 'V-Strom', 'Boulevard', 'Gixxer']
  },
  {
    id: 'harley',
    name: 'Harley-Davidson',
    nameAr: 'هارلي ديفيدسون',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Harley-Davidson_logo.svg/2560px-Harley-Davidson_logo.svg.png',
    models: ['Sportster', 'Softail', 'Touring', 'Street Glide', 'Road King', 'Fat Boy']
  },
  {
    id: 'bmw',
    name: 'BMW',
    nameAr: 'بي إم دبليو',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/BMW.svg/2048px-BMW.svg.png',
    models: ['S1000RR', 'R1250GS', 'K1600', 'F850GS', 'R18']
  },
  {
    id: 'ducati',
    name: 'Ducati',
    nameAr: 'دوكاتي',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Ducati_red_logo.svg/500px-Ducati_red_logo.svg.png',
    models: ['Panigale V4', 'Monster', 'Multistrada', 'Diavel', 'Scrambler']
  }
];

export const VehicleColors = [
  'أبيض',
  'أسود',
  'رمادي',
  'فضي',
  'أحمر',
  'أزرق',
  'بني',
  'أخضر',
  'بيج',
  'ذهبي',
  'أصفر',
  'برتقالي',
  'بنفسجي',
  'برونزي',
  'عنابي',
  'كحلي',
  'زيتي',
  'فيروزي',
  'زهري',
  'لؤلؤي',
  'ماروني',
  'تيتانيوم',
  'أخرى'
];

