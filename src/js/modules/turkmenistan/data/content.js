/**
 * ВЕСЬ ТЕКСТ СЕКЦИИ.
 * Меняете подпись на карте или абзац справа — только здесь, в разметку лезть не нужно.
 * Для мультиязычности продублируйте объект и отдавайте нужный в initTurkmenistanMap().
 */
export const CONTENT = {
	title: 'Turkmenistan',

	/** Текст справа, когда ни один велаят не выбран. */
	intro: [
		'Turkmenistan is divided into five welayats (provinces) — Ahal, Balkan, Daşoguz, Lebap, and Mary — plus the capital city of Ashgabat, which holds province-level status on its own. Roughly 80% of the country is covered by the Karakum Desert, so settlement, agriculture, and industry concentrate in oases, river valleys, and along the Caspian coast.',
		'Population and area data are obtained from open sources of the 2022 national population census, published on Wikipedia, Grokipedia, and the State Statistics Committee of Turkmenistan.',
	],

	/** Подсказка под картой (мышь: есть курсор и колесо). */
	hint: 'Select a welayat · scroll to zoom',
	/** То же для сенсорных экранов: колеса нет, зум недоступен. */
	hintTouch: 'Tap a welayat',
	back: 'All welayats',

	/**
	 * Велаяты. Ключ обязан совпадать с "id" объекта в welayats.geo.json.
	 * labelAt — [долгота, широта] точки, где стоит подпись на карте.
	 */
	welayats: {
		balkan: {
			name: 'BALKAN',
			title: 'BALKAN GENERAL INFO:',
			labelAt: [55.36, 39.27],
			generalInfo: [
				{
					label: 'Population / Area: ',
					value:
						'~530,000 across 139,270 km² - the largest welayat by area but the most sparsely populated.',
				},
				{
					label: 'Capital: ',
					value: 'Balkanabat (formerly Nebit Dag).',
				},
				{
					label: 'Borders: ',
					value:
						'Kazakhstan and Uzbekistan to the north, Iran to the south, the Caspian Sea to the west, and internally borders Ahal and Daşoguz to the east.',
				},
				{
					label: 'Terrain: ',
					value:
						'Caspian coastline, the Balkan mountain range, the dramatic Yangykala Canyon ("Turkmen Grand Canyon"), and the Ogurja Ada island (the largest island in the Caspian Sea, part of a nature reserve). Very low water availability - only about 4.5% of Turkmenistan`s arable land lies here, so agriculture is negligible.',
				},
				{
					label: 'Economy / Industry: ',
					value:
						'Turkmenistan`s hydrocarbon heartland - the single most economically important welayat for oil:',
				},
				{
					items: [
						'95.9% of national oil production and roughly 14–17% of natural gas production',
						'Home to Turkmenbashi Oil Processing Complex (TOPC), the country`s largest refinery, with capacity of 9-10+ million tons/year and the highest refining depth in the world (~85%)',
						'Turkmenbashy International Seaport - the country`s major Caspian seaport, modernized in 2018, handling up to ~25–27 million tons of cargo annually, with ferry service to Baku, Azerbaijan',
						'Balkan Shipbuilding and Repair Yard',
						'Balkan Cement Plant (Jebel) - 1 million tons/year capacity',
						'Iodine and bromine production (Balkanabat, Hazar, Bereket) - Turkmenistan`s only source of these chemicals',
						'The Gyyanly polymer plant and Garabogaz urea/potassium plant',
						'Generates about 15% of national electric power',
					],
				},
				{
					label: 'Known for: ',
					value:
						'Oil and gas extraction since the early 1900s (Cheleken Peninsula); the Awaza tourist zone on the Caspian coast (hotels, resorts); the Yangykala Canyon`s colorful rock formations.',
				},
				{
					label: 'Landmarks: ',
					value:
						'Kow-Ata-style desert formations, Yangykala Canyon, Ogurja Ada nature reserve, Dehistan archaeological ruins, the Awaza resort strip.',
				},
				{
					label: 'Infrastructure: ',
					value:
						'Turkmenbashy International Airport and Seaport (Trans-Caspian Railway`s western terminus); the M37 highway runs from Turkmenbashy eastward through the entire country; smaller airports in Balkanabat, Etrek, Garabogaz, Hazar, and Jebel.',
				},
			],
			titleIndustry: 'BALKAN INDUSTRY:',
			tables: [
				//  Таблица Turkmenbashy Oil Refining Complex (TOPC / TNGIZT)
				{
					title: 'Turkmenbashy Oil Refining Complex (TOPC / TNGIZT)',
					rows: [
						{
							label: 'Location',
							value:
								'City of Türkmenbaşy (formerly Krasnovodsk), Balkan Province, eastern shore of the Caspian Sea. Approx. 40°0′N, 52°58′E.',
						},
						{
							label: 'Founded',
							value:
								'Originally built in the Soviet period (1940s–50s as a small refinery); massively rebuilt and expanded into its current form mainly from the mid-1990s through the 2010s under independent Turkmenistan.',
						},
						{
							label: 'Operator',
							value:
								'State - Turkmennebit State Concern (state oil company). Not open to foreign equity; foreign firms participate only as EPC contractors/suppliers.',
						},
						{
							label: 'Core function',
							value:
								'Crude oil refining: atmospheric/vacuum distillation, catalytic cracking/reforming, coking, de-asphalting, lube oil and bitumen production, polypropylene unit on-site.',
						},
						{
							label: 'Products',
							value:
								'Unleaded gasoline (various octane grades), aviation/industrial kerosene, diesel, fuel oil, motor oil, polypropylene, heating fuel, petroleum coke, liquefied gas, construction/road bitumen, laundry detergent, lube oils.',
						},
					],
				},

				//  Таблица Kiyanly Gas Chemical (Polymer) Complex
				{
					title: 'Kiyanly Gas Chemical (Polymer) Complex',
					rows: [
						{
							label: 'Location',
							value:
								'Gyyanly (Kiyanly) settlement, Türkmenbaşy District, Balkan Province, on the Caspian Sea coast.',
						},
						{
							label: 'Commissioned',
							value: 'October 17, 2018.',
						},
						{
							label: 'Owner / Operator',
							value:
								'State - originally Türkmengaz; a 2021 government decision ordered transfer of ownership/operation to Türkmenhimiýa (Turkmenchemistry), though full transfer has not been publicly confirmed as completed.',
						},
						{
							label: 'Core function',
							value:
								'Cracks natural gas (ethane/methane fractions) into ethylene and propylene, then polymerizes these into polyethylene and polypropylene resin.',
						},
					],
				},

				//  Таблица Garabogaz Carbamide (Urea) Plant — Phase I
				{
					title: 'Garabogaz Carbamide (Urea) Plant — Phase I',
					rows: [
						{
							label: 'Location',
							value:
								'~3.5 km east of Garabogaz city center, Balkan Province, on the Caspian Sea coast (Garabogaz Gulf area).',
						},
						{
							label: 'Commissioned',
							value: 'September 18, 2018.',
						},
						{
							label: 'Operator',
							value: 'State - Türkmenhimiýa (Turkmenchemistry) State Concern.',
						},
						{
							label: 'Core function / process tech',
							value:
								'Ammonia + urea fertilizer production from natural gas feedstock. Ammonia process: Haldor Topsøe (Denmark) technology. Urea synthesis: Saipem (Italy) technology. Urea granulation: Uhde Fertilizer Technology (Netherlands) fluid-bed technology. CO₂-purification: UOP (USA) technology. Automation: Yokohama (Japan).',
						},
					],
				},

				//  Таблица Garabogaz Carbamide (Urea) Plant — Phase II (new, under construction)
				{
					title:
						'Garabogaz Carbamide (Urea) Plant — Phase II (new, under construction)',
					rows: [
						{
							label: 'Status',
							value:
								'EPC contract signed November 10, 2025; groundbreaking ceremony held November 2, 2025, attended by President Serdar Berdimuhamedov. Scheduled to commence operations in 2030.',
						},
						{
							label: 'Location',
							value:
								'Coastline of the Caspian Sea at Kiyanly (Gyýanly), Balkan Province — i.e. co-located with / adjacent to the existing Kiyanly polymer complex, expanding the site`s role as a chemicals hub.',
						},
						{
							label: 'Operator',
							value: 'State — State Concern Türkmenhimiýa.',
						},
					],
				},

				//  Таблица Cheleken Contract Area (Dzheitune/Lam & Dzhygalybeg/Zhdanov fields)
				{
					title:
						'Cheleken Contract Area (Dzheitune/Lam & Dzhygalybeg/Zhdanov fields)',
					rows: [
						{
							label: 'Location',
							value:
								'Offshore eastern Caspian Sea, ~40–45 km from shore, operated from an onshore base near the town of Hazar (formerly Cheleken), Balkan Province. Contract area covers 950 km²; lies on the eastern end of the Apsheron Ridge.',
						},
						{
							label: 'Operator',
							value:
								'Dragon Oil (Turkmenistan) Ltd. — wholly owned subsidiary of Dragon Oil Holdings, itself wholly owned by the Emirates National Oil Company (ENOC), a Dubai-government entity. This is the largest pure foreign-operator (non-state) hydrocarbon asset in Turkmenistan.',
						},
						{
							label: 'Contract structure',
							value:
								'Production Sharing Agreement (PSA) with the Turkmen government (via state concern Türkmennebit), effective May 1, 2000, originally for 25 years; extended in July 2022 to run until May 1, 2035.',
						},
						{
							label: 'First production',
							value:
								'First well drilled in the Dzheitune (Lam) field in 1967 (Soviet era); first production 1978; Dragon Oil`s modern redevelopment began 2000.',
						},
					],
				},

				//  Таблица Türkmenbaşy International Seaport
				{
					title: 'Türkmenbaşy International Seaport',
					rows: [
						{
							label: 'Location',
							value:
								'Eastern coast of the Caspian Sea, city of Türkmenbaşy (formerly Krasnovodsk), Balkan Province. Approx. coordinates 40°00′N, 52°58′–53°02′E.',
						},
						{
							label: 'Founded',
							value:
								'Original port founded October 1896; Merchant Marine Port Authority established January 1, 1903; ferry terminal construction began 1959, regular Krasnovodsk–Baku ferry service from 1962.',
						},
						{
							label: 'New port complex',
							value:
								'A new $1.5 billion expanded seaport was inaugurated May 2, 2018, after construction beginning August 2013, built by Turkey`s Gap İnşaat under a contract with the Turkmenistan State Service of Sea and River Transport.',
						},
						{
							label: 'Owner / Operator',
							value:
								'State — Turkmenistan State Maritime and River Transport Agency.',
						},
						{
							label: 'Shipbuilding / Repair',
							value:
								'“Balkan” shipyard built by Gap İnşaat (2014 contract with the State Service of Sea and River Transport): capacity to process 12,000 t/yr of steel, build 4–6 vessels/yr, and service/repair another 20–30 vessels/yr.',
						},
					],
				},
			],
			/* text: [
				'<strong>Balkan</strong> is the western gateway of the country: the Caspian shelf, the port of Turkmenbashi, and the refining cluster around it. Offshore platforms and coastal terminals make it the region with the highest concentration of marine logistics.',
				'Services here focus on corrosion control in a saline atmosphere, subsea line inspection, and turnaround support for refining units.',
			], */
			imgWelayat: 'welayats/balkan',
		},
		dashoguz: {
			name: 'DASHOGUZ',
			title: 'DASHOGUZ GENERAL INFO:',
			labelAt: [58.89, 41.12],
			generalInfo: [
				{
					label: 'Population / Area: ',
					value:
						'~1,550,000 across 73,430 km² - the smallest welayat by area but densely populated.',
				},
				{
					label: 'Capital: ',
					value:
						'Dashoguz (Dashoguz city), an industrial hub and gateway to the Karakalpak region of Uzbekistan.',
				},
				{
					label: 'Borders: ',
					value:
						'Uzbekistan to the north and east only - entirely landlocked within Turkmenistan`s other provinces and Uzbekistan.',
				},
				{
					label: 'Terrain: ',
					value:
						'Mostly flat desert and irrigated oasis land along the lower Amu Darya. The region suffers severe environmental degradation linked to the Aral Sea ecological crisis - rising soil salinity has damaged large areas of farmland.',
				},
				{
					label: 'Economy / Industry: ',
					value: 'Agriculture-driven:',
				},
				{
					items: [
						'Major cotton, vegetable, fruit, melon, and grain producer; raw cotton processing and a large textile/cotton-spinning complex in Dashoguz city',
						'Animal husbandry is well developed',
						'Light industry and food processing dominate; building-materials production is also present',
						'Heavily reliant on the Karakum Canal and Amu Darya-fed irrigation, though water quality and salinity are ongoing problems',
					],
				},
				{
					label: 'Known for: ',
					value:
						'The region contains the UNESCO World Heritage Site of Koneurgench, the historic capital of Khwarezm Empire with its famous minarets and mausoleums.',
				},
				{
					label: 'Landmarks / Heritage: ',
					value:
						'Koneurgench (Kunya-Urgench) - a UNESCO World Heritage Site with the Turabek-Khanim mausoleum and the Kutlug-Timur minaret; the fortresses of Devkesen, Shasenem, Izmukshir, and Kenevas; part of the Darvaza Gas Crater region lies within Dashoguz`s portion of the Karakum.',
				},
				{
					label: 'Infrastructure: ',
					value:
						'Dashoguz international-class domestic airport; road links to Konye-Urgench and the Uzbek border crossing near Khiva (a popular overland entry point for tourists); part of the Ashgabat–Karakum–Dashoguz highway.',
				},
			],
			/* text: [
				'Daşoguz lies in the north, in the lower reaches of the Amu Darya. Irrigated agriculture and gas transmission corridors toward the northern border define the regional infrastructure.',
				'Typical scope: compressor station maintenance, line valve replacement, and integrity assessment of ageing transmission sections.',
			], */
			imgWelayat: 'welayats/dashoguz',
		},
		ahal: {
			name: 'AHAL',
			title: 'AHAL GENERAL INFO:',
			labelAt: [58.72, 38.87],
			generalInfo: [
				{
					label: 'Population / Area: ',
					value: '~887,000 across 97,160 km².',
				},
				{
					label: 'Capital: ',
					value:
						'Arkadag (a newly built "smart city," province capital since December 2022, replacing Anau). Ahal previously administered Ashgabat itself, though the capital is now a separate province-equivalent unit.',
				},
				{
					label: 'Borders: ',
					value:
						'Iran and Afghanistan along the Kopet Dag mountain range to the south; internally borders nearly every other welayat, sitting at the country`s geographic core.',
				},
				{
					label: 'Terrain: ',
					value:
						'Mix of the Kopet Dag foothills (fertile, irrigated) and Karakum Desert to the north. The Karakum Canal crosses the province east–west, and the Tejen River feeds two large reservoirs in the south.',
				},
				{
					label: 'Economy / Industry: ',
					value:
						'The most industrially important welayat outside Ashgabat - around 31% of Turkmenistan`s total industrial output and 23% of agricultural production by value (2000 figures, still broadly indicative). Key industries:',
				},
				{
					items: [
						'Natural gas extraction and gas-to-gasoline conversion',
						'Textiles - major denim, knitwear, and cotton-fabric mills in Gokdepe and Kaka, among the largest such facilities regionally',
						'Cotton ginning and cottonseed oil processing',
						'Cement (Baherden and Kelete plants), steel (rebar from scrap), and the Tejen urea/fertilizer plant',
						'Agriculture: fine-fiber cotton, wheat, and livestock, irrigated by the Karakum Canal',
					],
				},
				{
					label: 'Known for: ',
					value:
						'Ahal-Teke horses (Turkmenistan`s national symbol, bred at stud farms near Ashgabat); the Battle of Geok Tepe (1881); the Kow Ata underground sulfur lake.',
				},
				{
					label: 'Landmarks / Heritage: ',
					value:
						'Old Nisa (UNESCO World Heritage Site, ancient Parthian capital, ~25 minutes from Ashgabat); Geok Tepe fortress, Darvaza Gas Crater area straddles the Ahal/Daşoguz boundary in the Karakum.',
				},
				{
					label: 'Infrastructure: ',
					value:
						'Dense road and rail links radiating from Ashgabat; domestic airstrips at Airport village and Gawers; the new capital Arkadag was built with extensive modern infrastructure.',
				},
			],
			titleIndustry: 'AHAL INDUSTRY:',
			tables: [
				//  Таблица Ovadandepe Gas-to-Gasoline (GTL) Plant
				{
					title: 'Ovadandepe Gas-to-Gasoline (GTL) Plant',
					rows: [
						{
							label: 'Location',
							value:
								'Owadandepe settlement, Gökdepe District, Ahal Province — about 50 km from Ashgabat, near the Ashgabat–Dashoguz highway.',
						},
						{
							label: 'Commissioned',
							value: 'June 28, 2019.',
						},
						{
							label: 'Operator',
							value: 'State — Türkmengaz State Concern.',
						},
						{
							label: 'Core function',
							value:
								'World`s first plant for industrial-scale production of gasoline directly from natural gas (Guinness World Records recognition; technology verified by the UK`s Institution of Chemical Engineers, IChemE). Converts natural gas into synthetic gasoline via Topsøe`s TIGAS process.',
						},
					],
				},

				//  Таблица Tejen Urea Plant
				{
					title: 'Tejen Urea Plant',
					rows: [
						{
							label: 'Location',
							value:
								'City of Tejen, Ahal Province (near the border area toward Mary Province).',
						},
						{
							label: 'Commissioned',
							value:
								'March 18, 2005 — the oldest of Turkmenistan`s three urea plants.',
						},
						{
							label: 'Operator',
							value: 'State — Türkmenhimiýa.',
						},
					],
				},

				//  Таблица Derweze State Power Station
				{
					title: 'Derweze State Power Station',
					rows: [
						{
							label: 'Location',
							value:
								'Near Owadandepe, Gökdepe District, Ahal Province (close to the GTL plant).',
						},
						{
							label: 'Commissioned',
							value: '2015.',
						},
						{
							label: 'Capacity',
							value: '~504.4 MW (simple-cycle gas turbine plant).',
						},
					],
				},

				//  Таблица Ahal State Power Station
				{
					title: 'Ahal State Power Station',
					rows: [
						{
							label: 'Location',
							value: 'Ahal Province, near Ashgabat.',
						},
						{
							label: 'Commissioned',
							value:
								'Construction began 2013, delivered to the Ministry of Energy December 2014; further phases (Ahal-2, Ahal-3) added through 2014–16.',
						},
						{
							label: 'Capacity',
							value:
								'Reported between ~252–648 MW depending on phase/source (multi-phase simple-cycle plant); a commonly cited combined figure is 648 MW.',
						},
					],
				},
			],
			/* text: [
				'Ahal stretches along the Kopet Dag foothills and carries the capital region. Galkynysh and the gas-to-gasoline complex at Owadandepe put the heaviest processing load of the country in this welayat.',
				'Work here is dominated by rotating equipment overhauls, static equipment inspection, and shutdown planning for processing trains.',
			], */
			imgWelayat: 'welayats/ahal',
		},
		lebap: {
			name: 'LEBAP',
			title: 'LEBAP GENERAL INFO:',
			labelAt: [63.3, 38.4],
			generalInfo: [
				{
					label: 'Population / Area: ',
					value:
						'~1,447,000, about 20.5% of the national population, across 93,730 km².',
				},
				{
					label: 'Capital: ',
					value:
						'Turkmenabat, a major transport and economic hub on the Amu Darya.',
				},
				{
					label: 'Borders: ',
					value:
						'Uzbekistan to the north and east; Afghanistan to the south across the Amu Darya; internally borders Mary and Ahal to the west.',
				},
				{
					label: 'Terrain: ',
					value:
						'Riverine oases along the Amu Darya, with desert further from the river. Demographic and agricultural concentration follows the river corridor.',
				},
				{
					label: 'Economy / Industry: ',
					value: '',
				},
				{
					items: [
						'Agro-processing and cotton/textile production are central, with industry clustered in Turkmenabat',
						'Limited hydrocarbon extraction; the Seydi oil refinery (built in the Soviet era, ~6 million tons/year design capacity) is located here',
						'Higher rural population density tied to cotton and grain farming',
						'Significant healthcare and rural infrastructure investment historically (hospital beds, family doctor networks) to support the agrarian workforce',
					],
				},
				{
					label: 'Known for: ',
					value:
						'Its role as an eastern trade and transport gateway, connecting Turkmenistan to Uzbekistan via the Amu Darya crossing; the Koytendag mountain range in the far east, with dinosaur footprints and rugged terrain near the Uzbekistan border.',
				},
				{
					label: 'Landmarks: ',
					value:
						'Koytendag Nature Reserve (dinosaur plateau, caves, the Koytendag mountains - Turkmenistan`s highest peak, Ayrybaba, at 3,137 m, is here); historic sites around Turkmenabat and Kerki (which gained a new international-class airport in 2021).',
				},
				{
					label: 'Infrastructure: ',
					value:
						'Kerki International Airport (commissioned 2021); Turkmenabat is a key node on the Trans-Caspian Railway and the M37 highway; the city serves as the eastern terminus for much of the country`s rail and road network toward Uzbekistan.',
				},
			],
			titleIndustry: 'LEBAP INDUSTRY:',
			tables: [
				//  Таблица Seydi Oil Refinery (SOR / SNPZ)
				{
					title: 'Seydi Oil Refinery (SOR / SNPZ)',
					rows: [
						{
							label: 'Location',
							value:
								'City of Seydi, Danew (Dyanevsky) District, Lebap Province, eastern Turkmenistan, on the Amu Darya side of the country (far from the Caspian).',
						},
						{
							label: 'Founded',
							value:
								'The surrounding settlement (Neftezavodsk) arose in 1973 specifically around the construction of the refinery; renamed Seydi in 1990 after the Turkmen poet Seyitnazar Seydi.',
						},
						{
							label: 'Owner / Operator',
							value:
								'State — Türkmennebit, operating as part of TCOR alongside Turkmenbashy.',
						},
						{
							label: 'Core function',
							value:
								'Secondary/inland crude refining — gasoline, diesel, bitumen, LPG, fuel oil. Smaller than Turkmenbashy but strategically placed to serve the eastern (Lebap/Amu Darya) part of the country and feed exports toward Central Asia/Afghanistan.',
						},
						{
							label: 'Products (2023 actuals)',
							value:
								'~230,390 t of A-95/A-92/A-80 gasoline; ~123,680 t diesel fuel; ~30,065 t heavy vacuum gas oil; 5,375 t fuel oil; 22,680 t road bitumen. Catalytic reforming unit can produce up to 500,000 t/yr of high-octane gasoline component.',
						},
					],
				},

				//  Таблица Garlyk Potash Mining & Processing Complex
				{
					title: 'Garlyk Potash Mining & Processing Complex',
					rows: [
						{
							label: 'Location',
							value:
								'Garlyk village, Lebap Province, north-eastern Turkmenistan, sited over the Garlyk potash deposit (estimated >2 billion tonnes; Turkmenistan`s three identified potash deposits — Garlyk, Karabil, Tübegatan — total an estimated 2.8 billion tonnes).',
						},
						{
							label: 'Commissioned',
							value:
								'March 31, 2017 (groundbreaking 2010, construction started 2009; took 7 years against an original 5-year plan).',
						},
						{
							label: 'Operator',
							value:
								'State — Türkmenhimiýa Holding (the first industrial potash-fertilizer enterprise in Turkmenistan).',
						},
						{
							label: 'Core function',
							value:
								'Underground mining and processing of potassium ore into potassium chloride (fine-grained and granular potash fertilizer).',
						},
					],
				},
			],
			/* text: [
				'Lebap follows the Amu Darya from the southeast to the north, linking the Köýtendag foothills with the eastern export corridor. It is the main transit region for pipelines heading east.',
				'Field activity covers pipeline crossings, cathodic protection surveys, and civil works along the right-of-way.',
			], */
			imgWelayat: 'welayats/lebap',
		},
		mary: {
			name: 'MARY',
			title: 'MARY GENERAL INFO:',
			labelAt: [62.2, 36.9],
			generalInfo: [
				{
					label: 'Population / Area: ',
					value: '~1.62 million, covering 87,150 km².',
				},
				{
					label: 'Capital: ',
					value: 'Mary city, about 30 km from the ancient ruins of Merv.',
				},
				{
					label: 'Borders: ',
					value:
						'Afghanistan to the south; Uzbekistan to the east; internally borders Ahal to the west and Lebap to the north.',
				},
				{
					label: 'Terrain: ',
					value:
						'The Murgab River basin creates fertile oases amid the surrounding Karakum Desert; arid desert dominates outside the irrigated river valley.',
				},
				{
					label: 'Economy / Industry: ',
					value:
						'Historically agriculture-based (cotton, grain, oasis farming), but oil and gas exploration has grown significantly in recent years, alongside petrochemical and potassium fertilizer production. Mary is also home to a major thermal power plant (one of Turkmenistan`s largest, originally built starting 1969, reaching 1.686 GW design capacity) and hosts one of the country`s primary natural gas fields (Dovletabat) along with the South Yolotan-Osman gas field - among the largest gas deposits in the world.',
				},
				{
					label: 'Known for: ',
					value:
						'Mary is arguably the strongest historic landmark: Ancient Merv, a UNESCO World Heritage Site, is one of the best-preserved oasis cities on the Silk Road, and was once among the largest cities in the world before the Mongols destroyed it in 1221. Alexander the Great conquered the territory in the 4th century BC on his way to South Asia. In 330 BC, Alexander marched northward into Central Asia and founded the city of Alexandria Margiana (Merv) near the Murghab River. A busy Silk Road caravan route, connecting Tang dynasty China and the city of Baghdad (in modern Iraq), passed through Merv.',
				},
				{
					label: 'Infrastructure: ',
					value:
						'Mary domestic airport; road and rail connections via the M37 highway and Trans-Caspian Railway; a former military airfield at Galaymor is slated for civilian conversion.',
				},
			],
			titleIndustry: 'MARY INDUSTRY:',
			tables: [
				//  Таблица Mary Ammonia & Urea Plant (Maryazot)
				{
					title: 'Mary Ammonia & Urea Plant (Maryazot)',
					rows: [
						{
							label: 'Location',
							value: 'City of Mary, Mary Province, south-eastern Turkmenistan.',
						},
						{
							label: 'Commissioned',
							value: 'October 17, 2014.',
						},
						{
							label: 'Operator',
							value: 'State — Türkmenhimiýa.',
						},
					],
				},

				//  Таблица Mary-3 Combined-Cycle Power Plant
				{
					title: 'Mary-3 Combined-Cycle Power Plant',
					rows: [
						{
							label: 'Location',
							value: 'City of Mary, Mary Province',
						},
						{
							label: 'Commissioned',
							value: 'September 2018.',
						},
						{
							label: 'Operator',
							value: 'State — Türkmenenergo.',
						},
						{
							label: 'Capacity',
							value:
								'1,574 MW — Turkmenistan`s first combined-cycle plant and the largest combined-cycle plant in Central Asia built in a single construction phase. (Total Mary power-station site capacity, including older simple-cycle units, is reported at over 3,250–3,400 MW by some trackers.)',
						},
					],
				},

				//  Таблица Galkynysh Gas Field
				{
					title: 'Galkynysh Gas Field',
					rows: [
						{
							label: 'Location',
							value:
								'Near Ýolöten (Yoloten), Mary Province, ~75 km south-east of the city of Mary and ~400 km south-east of Ashgabat. Comprises a cluster: South Iolotan, Osman, Minara and Yashlar structures.',
						},
						{
							label: 'Owner / Operator',
							value: 'State — Türkmengaz State Concern.',
						},
						{
							label: 'Reserves',
							value:
								'Among the world`s largest gas fields — estimates range 4–14 trillion m³ by various assessments; Gaffney, Cline & Associates (GCA, UK) put combined reserves of Galkynysh with neighboring Garakol and Yashlar fields at 27.4 trillion m³; proven commercial reserves cited at 2.8 trillion m³. Also holds an estimated 300 million tonnes of oil reserves.',
						},
						{
							label: 'Production start',
							value: 'September 2013 (Phase 1 completion).',
						},
					],
				},

				//  Таблица Dauletabad (Döwletabat) Gas Field
				{
					title: 'Dauletabad (Döwletabat) Gas Field',
					rows: [
						{
							label: 'Location',
							value:
								'Mary Province, south-eastern Turkmenistan, near the Iran/Afghanistan border zone.',
						},
						{
							label: 'Status',
							value:
								'One of Turkmenistan`s oldest and historically most important gas fields (smaller than Galkynysh, which GCA assessed as five times larger), still a key production and pipeline-origin point.',
						},
						{
							label: 'Owner / Operator',
							value: 'State — Türkmengaz.',
						},
					],
				},
			],
			/* text: [
				'Mary is the country’s gas heartland: the Galkynysh group, the Mary industrial hub, and a dense network of gathering lines and processing plants around the Murgap oasis.',
				'Services concentrate on wellhead equipment, gas treatment units, and environmental monitoring around production pads.',
			], */
			imgWelayat: 'welayats/mary',
		},
	},

	/** Столица со статусом велаята — отдельная подпись. */
	capital: { name: 'AŞGABAT', labelAt: [58.38, 37.95] },

	projectsTitle: 'Ynach Hyzmat completed projects',
	facilitiesTitle: 'Map legend',

	notes: [
		'* This map does not represent Ynonch Hyzmat’s complete portfolio of projects.',
		'* For detailed information regarding experience, contact us.',
	],

	/** Сообщение, если WebGL недоступен. */
	fallback:
		'Your browser does not support WebGL, so the interactive map is unavailable. The regional breakdown is listed below.',
	/** Сообщение, если карта не смогла загрузиться (данные, сеть, ошибка сборки). */
	error:
		'The interactive map could not be loaded. The regional breakdown is listed below.',
};
