/**
 * Идемпотентный сид: запускается при каждом старте, но наполняет базу
 * демо-данными только если она пустая. Админ создаётся из ADMIN_LOGIN/ADMIN_PASSWORD.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

type Q = { ru: string; uz: string; img?: string; a: [string, string][]; ok: number; eRu: string; eUz: string; topic: number };

const topics: [string, string][] = [
  ["Yoʻl belgilari", "Дорожные знаки"],
  ["Chorrahalardan oʻtish", "Проезд перекрёстков"],
  ["Umumiy qoidalar va xavfsizlik", "Общие положения и безопасность"],
  ["Birinchi tibbiy yordam", "Первая помощь"],
];

const Qs: Q[] = [
  { topic: 0, img: "/signs/give-way.svg", ru: "Что означает этот знак?", uz: "Bu belgi nimani anglatadi?",
    a: [["Главная дорога", "Asosiy yoʻl"], ["Уступите дорогу", "Yoʻl bering"], ["Движение без остановки запрещено", "Toʻxtamasdan harakatlanish taqiqlangan"], ["Опасный поворот", "Xavfli burilish"]], ok: 1,
    eRu: "Перевёрнутый треугольник с красной каймой — знак «Уступите дорогу». Нужно уступить транспорту на пересекаемой дороге.", eUz: "Qizil hoshiyali toʻntarilgan uchburchak — «Yoʻl bering» belgisi. Kesib oʻtilayotgan yoʻldagi transportga yoʻl berish kerak." },
  { topic: 0, img: "/signs/stop.svg", ru: "Что требует от водителя этот знак?", uz: "Bu belgi haydovchidan nimani talab qiladi?",
    a: [["Остановиться, только если на перекрёстке есть транспорт", "Chorrahada transport boʻlsagina toʻxtash"], ["Снизить скорость до 20 км/ч", "Tezlikni 20 km/soatgacha kamaytirish"], ["Остановиться перед стоп-линией и уступить дорогу", "Toʻxtash chizigʻi oldida toʻxtab, yoʻl berish"], ["Стоянка запрещена", "Toʻxtab turish taqiqlangan"]], ok: 2,
    eRu: "Знак «Движение без остановки запрещено» требует обязательной остановки, даже если дорога пуста.", eUz: "«Toʻxtamasdan harakatlanish taqiqlangan» belgisi yoʻl boʻsh boʻlsa ham majburiy toʻxtashni talab qiladi." },
  { topic: 0, img: "/signs/no-entry.svg", ru: "Как называется этот знак?", uz: "Bu belgi qanday ataladi?",
    a: [["Въезд запрещён", "Kirish taqiqlangan"], ["Остановка запрещена", "Toʻxtash taqiqlangan"], ["Движение запрещено", "Harakatlanish taqiqlangan"], ["Конец главной дороги", "Asosiy yoʻlning oxiri"]], ok: 0,
    eRu: "Красный круг с белой горизонтальной полосой — «Въезд запрещён» (кирпич). Запрещает въезд всем транспортным средствам в этом направлении.", eUz: "Oq gorizontal chiziqli qizil doira — «Kirish taqiqlangan». Bu yoʻnalishda barcha transport vositalarining kirishini taqiqlaydi." },
  { topic: 0, img: "/signs/main-road.svg", ru: "Что означает этот знак?", uz: "Bu belgi nimani anglatadi?",
    a: [["Перекрёсток равнозначных дорог", "Teng ahamiyatli yoʻllar chorrahasi"], ["Уступите дорогу", "Yoʻl bering"], ["Главная дорога", "Asosiy yoʻl"], ["Пересечение с второстепенной дорогой", "Ikkinchi darajali yoʻl bilan kesishuv"]], ok: 2,
    eRu: "Жёлтый ромб в белой рамке — «Главная дорога». На нерегулируемых перекрёстках вам уступают дорогу.", eUz: "Oq ramkadagi sariq romb — «Asosiy yoʻl». Tartibga solinmagan chorrahalarda sizga yoʻl beriladi." },
  { topic: 0, img: "/signs/crossing.svg", ru: "Что означает этот знак?", uz: "Bu belgi nimani anglatadi?",
    a: [["Дети", "Bolalar"], ["Пешеходный переход", "Piyodalar oʻtish joyi"], ["Пешеходная дорожка", "Piyodalar yoʻlkasi"], ["Подземный переход", "Yer osti oʻtish joyi"]], ok: 1,
    eRu: "Синий квадрат с пешеходом — знак особых предписаний «Пешеходный переход». Пешеходам на переходе нужно уступить.", eUz: "Piyoda tasvirlangan koʻk kvadrat — «Piyodalar oʻtish joyi». Oʻtish joyidagi piyodalarga yoʻl berish kerak." },
  { topic: 0, img: "/signs/no-overtaking.svg", ru: "Что запрещает этот знак?", uz: "Bu belgi nimani taqiqlaydi?",
    a: [["Движение грузовых автомобилей", "Yuk avtomobillari harakatini"], ["Обгон всех транспортных средств, кроме тихоходных", "Sekin yuruvchilardan tashqari barcha transportni quvib oʻtishni"], ["Движение ближе установленной дистанции", "Belgilangan masofadan yaqin harakatlanishni"], ["Стоянку легковых автомобилей", "Yengil avtomobillarning toʻxtab turishini"]], ok: 1,
    eRu: "Знак «Обгон запрещён» запрещает обгон всех транспортных средств, кроме тихоходных, гужевых повозок и двухколёсных мопедов и мотоциклов без коляски.", eUz: "«Quvib oʻtish taqiqlangan» belgisi sekin yuruvchi transport, ot-arava va kajavasiz ikki gʻildirakli mototsikllardan tashqari barchasini quvib oʻtishni taqiqlaydi." },
  { topic: 1, ru: "На нерегулируемом перекрёстке равнозначных дорог вы обязаны уступить дорогу:", uz: "Teng ahamiyatli yoʻllarning tartibga solinmagan chorrahasida kimga yoʻl berishingiz shart?",
    a: [["Транспорту, приближающемуся слева", "Chapdan yaqinlashayotgan transportga"], ["Транспорту, приближающемуся справа", "Oʻngdan yaqinlashayotgan transportga"], ["Встречному транспорту", "Qarama-qarshi transportga"], ["Никому — у всех равные права", "Hech kimga — hammaning huquqi teng"]], ok: 1,
    eRu: "На перекрёстке равнозначных дорог действует правило «помехи справа».", eUz: "Teng ahamiyatli yoʻllar chorrahasida «oʻngdagi xalaqit» qoidasi amal qiladi." },
  { topic: 1, ru: "Сигналы регулировщика противоречат сигналам светофора. Чем руководствоваться?", uz: "Tartibga soluvchining ishoralari svetofor ishoralariga zid. Nimaga amal qilish kerak?",
    a: [["Сигналами светофора", "Svetofor ishoralariga"], ["Дорожными знаками", "Yoʻl belgilariga"], ["Сигналами регулировщика", "Tartibga soluvchining ishoralariga"], ["Тем, что безопаснее по мнению водителя", "Haydovchi fikricha xavfsizroq boʻlganiga"]], ok: 2,
    eRu: "Сигналы регулировщика имеют приоритет над светофорами, знаками и разметкой.", eUz: "Tartibga soluvchining ishoralari svetofor, belgilar va chiziqlardan ustun turadi." },
  { topic: 1, ru: "Что означает мигающий жёлтый сигнал светофора?", uz: "Svetoforning miltillovchi sariq ishorasi nimani anglatadi?",
    a: [["Движение запрещено", "Harakatlanish taqiqlangan"], ["Движение разрешено, перекрёсток нерегулируемый — будьте внимательны", "Harakatlanishga ruxsat, chorraha tartibga solinmagan — ehtiyot boʻling"], ["Скоро включится зелёный", "Tez orada yashil yonadi"], ["Сигнал только для пешеходов", "Ishora faqat piyodalar uchun"]], ok: 1,
    eRu: "Мигающий жёлтый разрешает движение и информирует о нерегулируемом перекрёстке или пешеходном переходе.", eUz: "Miltillovchi sariq harakatga ruxsat beradi va tartibga solinmagan chorraha yoki piyodalar oʻtish joyi haqida ogohlantiradi." },
  { topic: 1, ru: "Поворачивая налево на зелёный сигнал светофора, вы должны уступить дорогу:", uz: "Svetoforning yashil ishorasida chapga burilayotganda kimga yoʻl berishingiz kerak?",
    a: [["Никому", "Hech kimga"], ["Транспорту, движущемуся слева", "Chapdan harakatlanayotgan transportga"], ["Встречному транспорту, движущемуся прямо и направо", "Toʻgʻriga va oʻngga harakatlanayotgan qarama-qarshi transportga"], ["Только трамваям попутного направления", "Faqat yoʻldosh yoʻnalishdagi tramvaylarga"]], ok: 2,
    eRu: "При повороте налево водитель безрельсового ТС уступает встречным, движущимся прямо или направо.", eUz: "Chapga burilishda haydovchi toʻgʻriga yoki oʻngga harakatlanayotgan qarama-qarshi transportga yoʻl beradi." },
  { topic: 2, ru: "Кто обязан пристёгиваться ремнями безопасности во время движения?", uz: "Harakat paytida kim xavfsizlik kamarini taqishi shart?",
    a: [["Только водитель", "Faqat haydovchi"], ["Водитель и пассажир на переднем сиденье", "Haydovchi va old oʻrindiqdagi yoʻlovchi"], ["Водитель и все пассажиры, если ремни предусмотрены конструкцией", "Haydovchi va barcha yoʻlovchilar, agar kamar konstruksiyada boʻlsa"], ["Только при движении за городом", "Faqat shahar tashqarisida"]], ok: 2,
    eRu: "Ремнём пристёгиваются все, кто находится в автомобиле, если он оборудован ремнями.", eUz: "Avtomobil kamar bilan jihozlangan boʻlsa, undagi barcha kishilar kamar taqadi." },
  { topic: 2, ru: "Можно ли управлять автомобилем в состоянии алкогольного опьянения?", uz: "Mast holda avtomobilni boshqarish mumkinmi?",
    a: [["Можно, если выпито немного", "Mumkin, agar oz ichilgan boʻlsa"], ["Можно в ночное время на пустой дороге", "Tunda boʻsh yoʻlda mumkin"], ["Нельзя", "Mumkin emas"], ["Можно, если рядом трезвый пассажир с правами", "Yonida guvohnomasi bor hushyor yoʻlovchi boʻlsa mumkin"]], ok: 2,
    eRu: "Управление транспортом в состоянии опьянения запрещено и строго наказывается вплоть до лишения прав.", eUz: "Mast holda transport boshqarish taqiqlangan va guvohnomadan mahrum qilishgacha jazolanadi." },
  { topic: 2, ru: "Как можно пользоваться телефоном во время движения?", uz: "Harakat paytida telefondan qanday foydalanish mumkin?",
    a: [["Держа телефон в руке, если разговор короткий", "Suhbat qisqa boʻlsa, telefonni qoʻlda ushlab"], ["Только через устройство, позволяющее говорить без рук", "Faqat qoʻllarni band qilmaydigan qurilma orqali"], ["Только стоя на красном сигнале", "Faqat qizil ishorada turganda"], ["Без ограничений", "Cheklovsiz"]], ok: 1,
    eRu: "Во время движения разрешено пользоваться телефоном только с гарнитурой или громкой связью.", eUz: "Harakat paytida telefondan faqat garnitura yoki baland ovozli aloqa orqali foydalanish mumkin." },
  { topic: 2, ru: "Когда водитель обязан включить аварийную сигнализацию?", uz: "Haydovchi qachon avariya signalizatsiyasini yoqishi shart?",
    a: [["При дорожно-транспортном происшествии", "Yoʻl-transport hodisasida"], ["При стоянке во дворе", "Hovlida toʻxtab turganda"], ["При обгоне", "Quvib oʻtishda"], ["При движении в дождь", "Yomgʻirda harakatlanishda"]], ok: 0,
    eRu: "Аварийная сигнализация включается при ДТП, вынужденной остановке в запрещённом месте, ослеплении светом фар и при буксировке.", eUz: "Avariya signalizatsiyasi YTHda, taqiqlangan joyda majburiy toʻxtashda, faralar koʻzni qamashtirganda va shatakka olishda yoqiladi." },
  { topic: 2, ru: "Где запрещён обгон?", uz: "Quvib oʻtish qayerda taqiqlangan?",
    a: [["На прямых участках дороги", "Yoʻlning toʻgʻri qismlarida"], ["На дорогах с тремя полосами в одном направлении", "Bir yoʻnalishda uch tasmali yoʻllarda"], ["На пешеходных переходах", "Piyodalar oʻtish joylarida"], ["В светлое время суток", "Kunning yorugʻ vaqtida"]], ok: 2,
    eRu: "Обгон запрещён на пешеходных переходах, перекрёстках, железнодорожных переездах, мостах и в тоннелях.", eUz: "Piyodalar oʻtish joylari, chorrahalar, temir yoʻl kesishmalari, koʻpriklar va tunnellarda quvib oʻtish taqiqlangan." },
  { topic: 2, ru: "Какой должна быть дистанция до впереди идущего транспорта?", uz: "Oldindagi transportgacha masofa qanday boʻlishi kerak?",
    a: [["Не менее 5 метров", "Kamida 5 metr"], ["Такой, чтобы избежать столкновения при его резком торможении", "U keskin tormozlaganda toʻqnashuvdan qochish mumkin boʻladigan"], ["Не менее длины одного автомобиля", "Kamida bitta avtomobil uzunligi"], ["Любой, если скорость небольшая", "Tezlik kichik boʻlsa, istalgan"]], ok: 1,
    eRu: "Безопасная дистанция зависит от скорости и состояния дороги и должна позволять избежать столкновения.", eUz: "Xavfsiz masofa tezlik va yoʻl holatiga bogʻliq va toʻqnashuvdan qochishga imkon berishi kerak." },
  { topic: 2, ru: "Что обязан сделать водитель перед перестроением?", uz: "Haydovchi tasmani almashtirishdan oldin nima qilishi shart?",
    a: [["Подать звуковой сигнал", "Ovozli signal berish"], ["Включить аварийную сигнализацию", "Avariya signalizatsiyasini yoqish"], ["Подать сигнал указателем поворота соответствующего направления", "Tegishli yoʻnalishdagi burilish koʻrsatkichi bilan ishora berish"], ["Включить дальний свет", "Uzoqni yorituvchi chiroqni yoqish"]], ok: 2,
    eRu: "Перед началом движения, перестроением, поворотом и остановкой нужно подать сигнал указателем поворота.", eUz: "Harakatni boshlash, tasma almashtirish, burilish va toʻxtashdan oldin burilish koʻrsatkichi bilan ishora berish kerak." },
  { topic: 3, ru: "Как остановить сильное артериальное кровотечение из раны на бедре?", uz: "Sondagi jarohatdan kuchli arterial qon ketishini qanday toʻxtatish mumkin?",
    a: [["Наложить жгут ниже раны", "Jgutni jarohatdan pastroqqa qoʻyish"], ["Наложить жгут выше раны", "Jgutni jarohatdan yuqoriroqqa qoʻyish"], ["Приложить холод и ждать", "Sovuq bosib kutish"], ["Дать пострадавшему воды", "Jabrlanuvchiga suv berish"]], ok: 1,
    eRu: "При артериальном кровотечении жгут накладывают выше раны и обязательно указывают время наложения.", eUz: "Arterial qon ketishda jgut jarohatdan yuqoriroqqa qoʻyiladi va qoʻyilgan vaqt albatta yozib qoʻyiladi." },
  { topic: 3, ru: "Пострадавший без сознания, но дышит. В какое положение его перевести?", uz: "Jabrlanuvchi hushsiz, lekin nafas olyapti. Uni qanday holatga keltirish kerak?",
    a: [["На спину, подложив под голову валик", "Boshi ostiga yostiq qoʻyib, chalqanchasiga"], ["Усадить, прислонив к машине", "Mashinaga suyab, oʻtqazish"], ["В устойчивое боковое положение", "Barqaror yonboshlagan holatga"], ["На живот", "Qorniga"]], ok: 2,
    eRu: "Устойчивое боковое положение защищает дыхательные пути от западания языка и попадания рвотных масс.", eUz: "Barqaror yonboshlagan holat nafas yoʻllarini til tushib qolishi va qusuq tushishidan himoya qiladi." },
  { topic: 2, ru: "Где запрещено движение задним ходом?", uz: "Orqaga harakatlanish qayerda taqiqlangan?",
    a: [["На парковке торгового центра", "Savdo markazi parkovkasida"], ["На перекрёстках и пешеходных переходах", "Chorrahalar va piyodalar oʻtish joylarida"], ["Во дворах жилых домов", "Turar-joy hovlilarida"], ["На второстепенной дороге", "Ikkinchi darajali yoʻlda"]], ok: 1,
    eRu: "Задний ход запрещён на перекрёстках, пешеходных переходах, мостах, в тоннелях и на железнодорожных переездах.", eUz: "Chorrahalar, piyodalar oʻtish joylari, koʻpriklar, tunnellar va temir yoʻl kesishmalarida orqaga harakatlanish taqiqlangan." },
];

async function main() {
  // Админ — всегда гарантируем наличие хотя бы одного
  const adminCount = await db.user.count({ where: { role: "ADMIN" } });
  if (adminCount === 0) {
    const login = process.env.ADMIN_LOGIN || "admin";
    const password = process.env.ADMIN_PASSWORD || "admin12345";
    await db.user.create({ data: { name: "Администратор", login, passwordHash: await bcrypt.hash(password, 10), role: "ADMIN" } });
    console.log(`[seed] admin created: ${login}`);
  }

  const existing = await db.settings.findUnique({ where: { id: 1 } });
  if (existing) {
    console.log("[seed] database already initialized, skipping demo content");
    return;
  }

  await db.settings.create({
    data: {
      id: 1,
      schoolName: "Yoʻl Usta",
      phone: "+998 71 200 00 00",
      phone2: "+998 90 123 45 67",
      email: "info@example.uz",
      instagram: "https://instagram.com/",
      telegram: "https://t.me/",
      licenseNo: "№ 000000",
      statGraduates: 4200,
      statPassRate: 87,
      statYears: 12,
      statCars: 24,
    },
  });

  await db.branch.createMany({
    data: [
      { nameUz: "Chilonzor filiali", nameRu: "Филиал Чиланзар", addressUz: "Toshkent, Chilonzor tumani, Bunyodkor shoh koʻchasi", addressRu: "Ташкент, Чиланзарский район, проспект Бунёдкор", phone: "+998 71 200 00 01", hours: "Пн–Сб 09:00–19:00", mapUrl: "https://yandex.uz/maps/", sort: 1 },
      { nameUz: "Yunusobod filiali", nameRu: "Филиал Юнусабад", addressUz: "Toshkent, Yunusobod tumani, Amir Temur shoh koʻchasi", addressRu: "Ташкент, Юнусабадский район, проспект Амира Темура", phone: "+998 71 200 00 02", hours: "Пн–Сб 09:00–19:00", mapUrl: "https://yandex.uz/maps/", sort: 2 },
    ],
  });

  await db.course.createMany({
    data: [
      { category: "B", titleUz: "Yengil avtomobil", titleRu: "Легковой автомобиль", descUz: "Eng koʻp tanlanadigan kurs. Mexanika yoki avtomat.", descRu: "Самый популярный курс. Механика или автомат.", durationUz: "3 oy", durationRu: "3 месяца", theoryHours: 136, practiceHours: 56, price: 4500000, oldPrice: 5000000, featured: true, sort: 1 },
      { category: "BC", titleUz: "Yengil va yuk avtomobili", titleRu: "Легковой и грузовой", descUz: "Ikki toifa bitta kursda — ish uchun qulay.", descRu: "Две категории за один курс — удобно для работы.", durationUz: "4 oy", durationRu: "4 месяца", theoryHours: 180, practiceHours: 82, price: 6800000, sort: 2 },
      { category: "A", titleUz: "Mototsikl", titleRu: "Мотоцикл", descUz: "Mototsikl va skuter boshqarish.", descRu: "Управление мотоциклом и скутером.", durationUz: "1,5 oy", durationRu: "1,5 месяца", theoryHours: 64, practiceHours: 18, price: 2200000, sort: 3 },
      { category: "C", titleUz: "Yuk avtomobili", titleRu: "Грузовой автомобиль", descUz: "B toifasi borlar uchun qayta tayyorlash.", descRu: "Переподготовка для тех, у кого уже есть категория B.", durationUz: "2 oy", durationRu: "2 месяца", theoryHours: 40, practiceHours: 34, price: 3900000, sort: 4 },
      { category: "D", titleUz: "Avtobus", titleRu: "Автобус", descUz: "Yoʻlovchi tashish uchun.", descRu: "Для пассажирских перевозок.", durationUz: "2,5 oy", durationRu: "2,5 месяца", theoryHours: 72, practiceHours: 40, price: 5200000, sort: 5 },
    ],
  });

  for (const [i, [uz, ru]] of topics.entries()) await db.topic.create({ data: { nameUz: uz, nameRu: ru, sort: i } });
  const topicRows = await db.topic.findMany({ orderBy: { sort: "asc" } });
  const t1 = await db.ticket.create({ data: { number: 1 } });
  const t2 = await db.ticket.create({ data: { number: 2 } });

  for (const [i, q] of Qs.entries()) {
    await db.question.create({
      data: {
        ticketId: i < 10 ? t1.id : t2.id,
        position: (i % 10) + 1,
        topicId: topicRows[q.topic].id,
        textRu: q.ru,
        textUz: q.uz,
        imageUrl: q.img ?? null,
        explanationRu: q.eRu,
        explanationUz: q.eUz,
        answers: { create: q.a.map(([ru, uz], j) => ({ textRu: ru, textUz: uz, position: j + 1, isCorrect: j === q.ok })) },
      },
    });
  }

  let memoUrl: string | null = null;
  const memoPath = join(process.cwd(), "prisma", "seed-assets", "pamyatka.pdf");
  if (existsSync(memoPath)) {
    const data = readFileSync(memoPath);
    const f = await db.storedFile.create({ data: { name: "pamyatka.pdf", mime: "application/pdf", size: data.length, data } });
    memoUrl = `/api/files/${f.id}`;
  }

  await db.book.createMany({
    data: [
      { titleUz: "Oʻquvchi eslatmasi", titleRu: "Памятка ученика", descUz: "Nazariy va amaliy imtihonga qanday tayyorlanish kerak.", descRu: "Как готовиться к теоретическому и практическому экзамену.", author: "Avtomaktab", lang: "both", fileUrl: memoUrl, sort: 1 },
      { titleUz: "Yoʻl harakati qoidalari", titleRu: "Правила дорожного движения", descUz: "Rasmiy matn. Administrator PDF faylni yuklaydi.", descRu: "Официальный текст. PDF загружает администратор.", lang: "both", sort: 2 },
      { titleUz: "Yoʻl belgilari va chiziqlar", titleRu: "Дорожные знаки и разметка", descUz: "Barcha belgilar rasmlar bilan.", descRu: "Все знаки с иллюстрациями.", lang: "both", sort: 3 },
    ],
  });

  await db.faq.createMany({
    data: [
      { questionUz: "Oʻqish qancha davom etadi?", questionRu: "Сколько длится обучение?", answerUz: "B toifasi — taxminan 3 oy. Aniq muddat guruh va jadvalga bogʻliq.", answerRu: "Категория B — около 3 месяцев. Точный срок зависит от группы и расписания.", sort: 1 },
      { questionUz: "Boʻlib toʻlash mumkinmi?", questionRu: "Можно ли платить частями?", answerUz: "Ha, toʻlovni bir necha qismga boʻlish mumkin. Menejer shartlarni aytib beradi.", answerRu: "Да, оплату можно разделить на несколько частей. Условия расскажет менеджер.", sort: 2 },
      { questionUz: "Necha yoshdan oʻqish mumkin?", questionRu: "С какого возраста можно учиться?", answerUz: "B toifasi uchun oʻqishni 17 yoshdan boshlash mumkin, imtihon — 18 yoshdan.", answerRu: "На категорию B можно начать учиться с 17 лет, сдавать экзамен — с 18.", sort: 3 },
      { questionUz: "Avtomat yoki mexanika?", questionRu: "Автомат или механика?", answerUz: "Ikkala variant ham bor. Mexanikada oʻqisangiz, ikkala turdagi mashinani boshqara olasiz.", answerRu: "Есть оба варианта. Если учитесь на механике, сможете водить машины с любой коробкой.", sort: 4 },
      { questionUz: "Imtihonga qanday tayyorlanaman?", questionRu: "Как подготовиться к экзамену?", answerUz: "Saytdagi biletlarni yeching va «Imtihon» rejimini sinab koʻring — u YHXB imtihoni kabi ishlaydi.", answerRu: "Решайте билеты на сайте и пробуйте режим «Экзамен» — он устроен как экзамен в ГАИ.", sort: 5 },
    ],
  });

  await db.review.createMany({
    data: [
      { name: "Dilnoza R.", text: "Instruktor juda sabrli edi. Imtihonni birinchi urinishda topshirdim!", category: "B" },
      { name: "Тимур А.", text: "Удобно, что билеты можно решать на сайте с телефона. На экзамене вопросы были знакомые.", category: "B" },
      { name: "Sardor M.", text: "BC kursini ish bilan birga oʻqidim, jadval moslashuvchan.", category: "BC" },
    ],
  });

  console.log("[seed] demo content created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
