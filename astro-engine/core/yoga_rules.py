from typing import List, Dict
from schemas.birth_data import ChartData, Yoga


class YogaDetector:
    """Detect classical Vedic astrology yogas from birth chart"""

    def __init__(self, chart: ChartData):
        self.chart = chart
        self.planets = {p.name: p for p in chart.planets}
        self.houses = {h.number: h for h in chart.houses}
        self.yogas_detected = []

    def detect_all(self) -> List[Yoga]:
        """Run all yoga detection rules"""
        self.yogas_detected = []
        self._viparita_detected = set()

        # Raj Yogas (Royal combinations)
        self._detect_gaja_kesari()
        self._detect_raj_yoga_5_9()
        self._detect_dhana_yoga()

        # Pancha Mahapurusha Yogas
        self._detect_ruchaka_yoga()
        self._detect_bhadra_yoga()
        self._detect_hamsa_yoga()
        self._detect_malavya_yoga()
        self._detect_sasa_yoga()

        # Viparita Raja Yogas
        self._detect_viparita_raja_yoga()

        # Wealth Yogas
        self._detect_lakshmi_yoga()
        self._detect_kubera_yoga()

        # Knowledge Yogas
        self._detect_budha_aditya_yoga()
        self._detect_saraswati_yoga()

        # Power Yogas
        self._detect_chandra_mangala_yoga()
        self._detect_guru_mangala_yoga()

        # Fame Yogas
        self._detect_amala_yoga()
        self._detect_chamara_yoga()

        # Other Important Yogas
        self._detect_adhi_yoga()
        self._detect_kahala_yoga()
        self._detect_vasumathi_yoga()
        self._detect_parvata_yoga()
        self._detect_neecha_bhanga_raja_yoga()
        self._detect_parijata_yoga()
        self._detect_kala_sarpa_yoga()
        self._detect_grahan_yoga()
        self._detect_srik_yoga()
        self._detect_voshi_yoga()
        self._detect_ubhayachari_yoga()
        self._detect_harsha_yoga()
        self._detect_sarala_yoga()
        self._detect_vimala_yoga()

        return self.yogas_detected

    def _get_planet_house(self, planet_name: str) -> int:
        """Get house number for a planet"""
        if planet_name in self.planets:
            return self.planets[planet_name].house
        return None

    def _get_house_lord(self, house_num: int) -> str:
        """Get lord of a house"""
        if house_num in self.houses:
            return self.houses[house_num].lord
        return None

    def _planets_in_kendra(self, planet_names: List[str]) -> bool:
        """Check if all planets are in kendra (1,4,7,10)"""
        kendras = [1, 4, 7, 10]
        for planet in planet_names:
            if self._get_planet_house(planet) not in kendras:
                return False
        return True

    def _planets_in_trikona(self, planet_names: List[str]) -> bool:
        """Check if all planets are in trikona (1,5,9)"""
        trikonas = [1, 5, 9]
        for planet in planet_names:
            if self._get_planet_house(planet) not in trikonas:
                return False
        return True

    def _are_planets_conjunct(self, planet1: str, planet2: str, orb: float = 10.0) -> bool:
        """Check if two planets are conjunct within orb"""
        if planet1 not in self.planets or planet2 not in self.planets:
            return False
        p1 = self.planets[planet1]
        p2 = self.planets[planet2]
        diff = abs(p1.longitude - p2.longitude)
        return diff <= orb or diff >= (360 - orb)

    def _detect_gaja_kesari(self):
        """Gaja Kesari Yoga: Moon and Jupiter in mutual kendras"""
        moon_house = self._get_planet_house('Moon')
        jupiter_house = self._get_planet_house('Jupiter')

        if moon_house and jupiter_house:
            diff = abs(moon_house - jupiter_house)
            if diff in [0, 3, 6, 9]:  # Kendras from each other
                strength = 'strong' if diff == 0 else 'moderate'
                self.yogas_detected.append(Yoga(
                    name='Gaja Kesari Yoga',
                    type='raj',
                    description='Moon and Jupiter in mutual kendras. Brings wisdom, wealth, and respect.',
                    strength=strength,
                    planets_involved=['Moon', 'Jupiter'],
                    houses_involved=[moon_house, jupiter_house],
                    classical_source='BPHS Chapter 41',
                    benefic=True
                ))

    def _detect_raj_yoga_5_9(self):
        """Raj Yoga: Lords of 5th and 9th house conjunct or in kendra"""
        lord_5 = self._get_house_lord(5)
        lord_9 = self._get_house_lord(9)

        if lord_5 and lord_9 and lord_5 in self.planets and lord_9 in self.planets:
            house_5th = self._get_planet_house(lord_5)
            house_9th = self._get_planet_house(lord_9)

            if self._are_planets_conjunct(lord_5, lord_9):
                self.yogas_detected.append(Yoga(
                    name='Dharma Karmadhipati Raj Yoga',
                    type='raj',
                    description='Lords of 5th and 9th houses conjunct. Powerful raj yoga for success.',
                    strength='strong',
                    planets_involved=[lord_5, lord_9],
                    houses_involved=[house_5th, house_9th],
                    classical_source='BPHS',
                    benefic=True
                ))

    def _detect_dhana_yoga(self):
        """Dhana Yoga: Lords of 2nd and 11th house connection"""
        lord_2 = self._get_house_lord(2)
        lord_11 = self._get_house_lord(11)

        if lord_2 and lord_11 and lord_2 in self.planets and lord_11 in self.planets:
            if self._are_planets_conjunct(lord_2, lord_11):
                self.yogas_detected.append(Yoga(
                    name='Dhana Yoga',
                    type='dhana',
                    description='Lords of 2nd and 11th houses conjunct. Indicates wealth accumulation.',
                    strength='moderate',
                    planets_involved=[lord_2, lord_11],
                    houses_involved=[self._get_planet_house(lord_2), self._get_planet_house(lord_11)],
                    classical_source='Classical texts',
                    benefic=True
                ))

    def _detect_ruchaka_yoga(self):
        """Ruchaka Yoga: Mars in kendra in own/exaltation sign"""
        mars_house = self._get_planet_house('Mars')
        mars = self.planets.get('Mars')

        if mars and mars_house in [1, 4, 7, 10]:
            if mars.dignity in ['own_sign', 'exalted']:
                self.yogas_detected.append(Yoga(
                    name='Ruchaka Yoga',
                    type='pancha_mahapurusha',
                    description='Mars in kendra in own/exaltation. Gives courage, military prowess.',
                    strength='strong',
                    planets_involved=['Mars'],
                    houses_involved=[mars_house],
                    classical_source='BPHS',
                    benefic=True
                ))

    def _detect_bhadra_yoga(self):
        """Bhadra Yoga: Mercury in kendra in own/exaltation sign"""
        mercury_house = self._get_planet_house('Mercury')
        mercury = self.planets.get('Mercury')

        if mercury and mercury_house in [1, 4, 7, 10]:
            if mercury.dignity in ['own_sign', 'exalted']:
                self.yogas_detected.append(Yoga(
                    name='Bhadra Yoga',
                    type='pancha_mahapurusha',
                    description='Mercury in kendra in own/exaltation. Brings intelligence, communication skills.',
                    strength='strong',
                    planets_involved=['Mercury'],
                    houses_involved=[mercury_house],
                    classical_source='BPHS',
                    benefic=True
                ))

    def _detect_hamsa_yoga(self):
        """Hamsa Yoga: Jupiter in kendra in own/exaltation sign"""
        jupiter_house = self._get_planet_house('Jupiter')
        jupiter = self.planets.get('Jupiter')

        if jupiter and jupiter_house in [1, 4, 7, 10]:
            if jupiter.dignity in ['own_sign', 'exalted']:
                self.yogas_detected.append(Yoga(
                    name='Hamsa Yoga',
                    type='pancha_mahapurusha',
                    description='Jupiter in kendra in own/exaltation. Bestows wisdom, spirituality.',
                    strength='strong',
                    planets_involved=['Jupiter'],
                    houses_involved=[jupiter_house],
                    classical_source='BPHS',
                    benefic=True
                ))

    def _detect_malavya_yoga(self):
        """Malavya Yoga: Venus in kendra in own/exaltation sign"""
        venus_house = self._get_planet_house('Venus')
        venus = self.planets.get('Venus')

        if venus and venus_house in [1, 4, 7, 10]:
            if venus.dignity in ['own_sign', 'exalted']:
                self.yogas_detected.append(Yoga(
                    name='Malavya Yoga',
                    type='pancha_mahapurusha',
                    description='Venus in kendra in own/exaltation. Grants luxury, artistic talent.',
                    strength='strong',
                    planets_involved=['Venus'],
                    houses_involved=[venus_house],
                    classical_source='BPHS',
                    benefic=True
                ))

    def _detect_sasa_yoga(self):
        """Sasa Yoga: Saturn in kendra in own/exaltation sign"""
        saturn_house = self._get_planet_house('Saturn')
        saturn = self.planets.get('Saturn')

        if saturn and saturn_house in [1, 4, 7, 10]:
            if saturn.dignity in ['own_sign', 'exalted']:
                self.yogas_detected.append(Yoga(
                    name='Sasa Yoga',
                    type='pancha_mahapurusha',
                    description='Saturn in kendra in own/exaltation. Gives discipline, longevity.',
                    strength='strong',
                    planets_involved=['Saturn'],
                    houses_involved=[saturn_house],
                    classical_source='BPHS',
                    benefic=True
                ))

    def _detect_viparita_raja_yoga(self):
        """Viparita Raja Yoga: Lords of 6,8,12 in 6,8,12 houses"""
        dusthana_lords = []
        for house in [6, 8, 12]:
            lord = self._get_house_lord(house)
            if lord and lord in self.planets:
                planet_house = self._get_planet_house(lord)
                if planet_house in [6, 8, 12]:
                    dusthana_lords.append(lord)

        if len(dusthana_lords) >= 2:
            # Deduplicate: use frozenset of planets as key to avoid duplicate detections
            combo_key = frozenset(dusthana_lords)
            if not hasattr(self, '_viparita_detected'):
                self._viparita_detected = set()
            if combo_key not in self._viparita_detected:
                self._viparita_detected.add(combo_key)
                self.yogas_detected.append(Yoga(
                    name='Viparita Raja Yoga',
                    type='raj',
                    description='Lords of dusthanas in dusthanas. Success from adversity.',
                    strength='moderate',
                    planets_involved=list(combo_key),
                    houses_involved=[self._get_planet_house(p) for p in combo_key],
                    classical_source='BPHS',
                    benefic=True
                ))

    def _detect_lakshmi_yoga(self):
        """Lakshmi Yoga: Lord of 9th strong in kendra/trikona AND Venus in own/exalted sign"""
        lord_9 = self._get_house_lord(9)
        venus = self.planets.get('Venus')
        if not (lord_9 and lord_9 in self.planets and venus):
            return

        house_9th_lord = self._get_planet_house(lord_9)

        # Condition 1: 9th lord in kendra or trikona
        if house_9th_lord not in [1, 4, 5, 7, 9, 10]:
            return

        # Condition 2: Venus must be in own sign (Taurus, Libra) or exalted (Pisces)
        venus_sign = venus.sign
        if venus_sign not in ['Taurus', 'Libra', 'Pisces']:
            return

        planets_involved = [lord_9]
        if lord_9 != 'Venus':
            planets_involved.append('Venus')

        self.yogas_detected.append(Yoga(
            name='Lakshmi Yoga',
            type='dhana',
            description='Lord of 9th in kendra/trikona with Venus in own/exalted sign. Brings wealth and prosperity.',
            strength='strong',
            planets_involved=planets_involved,
            houses_involved=[house_9th_lord, self._get_planet_house('Venus')],
            classical_source='Classical texts',
            benefic=True
        ))

    def _detect_kubera_yoga(self):
        """Kubera Yoga: Lord of ascendant and 2nd house strong"""
        lord_1 = self._get_house_lord(1)
        lord_2 = self._get_house_lord(2)

        if lord_1 and lord_2 and lord_1 in self.planets and lord_2 in self.planets:
            if self._are_planets_conjunct(lord_1, lord_2):
                self.yogas_detected.append(Yoga(
                    name='Kubera Yoga',
                    type='dhana',
                    description='Lords of 1st and 2nd conjunct. Great wealth yoga.',
                    strength='moderate',
                    planets_involved=[lord_1, lord_2],
                    houses_involved=[self._get_planet_house(lord_1)],
                    classical_source='Classical texts',
                    benefic=True
                ))

    def _detect_budha_aditya_yoga(self):
        """Budha Aditya Yoga: Sun and Mercury in close conjunction (within 8 degrees)"""
        if self._are_planets_conjunct('Sun', 'Mercury', orb=8.0):
            sun_house = self._get_planet_house('Sun')
            # Determine strength based on proximity
            sun = self.planets['Sun']
            mercury = self.planets['Mercury']
            diff = abs(sun.longitude - mercury.longitude)
            if diff > 180:
                diff = 360 - diff
            strength = 'strong' if diff <= 3.0 else 'moderate'
            self.yogas_detected.append(Yoga(
                name='Budha Aditya Yoga',
                type='knowledge',
                description='Sun-Mercury close conjunction. Grants intelligence and communication skills.',
                strength=strength,
                planets_involved=['Sun', 'Mercury'],
                houses_involved=[sun_house],
                classical_source='Classical texts',
                benefic=True
            ))

    def _detect_saraswati_yoga(self):
        """Saraswati Yoga: Mercury, Jupiter, Venus in kendra/trikona"""
        merc_house = self._get_planet_house('Mercury')
        jup_house = self._get_planet_house('Jupiter')
        ven_house = self._get_planet_house('Venus')

        benefic_houses = [1, 4, 5, 7, 9, 10]
        if (merc_house in benefic_houses and
            jup_house in benefic_houses and
            ven_house in benefic_houses):
            self.yogas_detected.append(Yoga(
                name='Saraswati Yoga',
                type='knowledge',
                description='Mercury, Jupiter, Venus in kendra/trikona. Grants learning and wisdom.',
                strength='strong',
                planets_involved=['Mercury', 'Jupiter', 'Venus'],
                houses_involved=[merc_house, jup_house, ven_house],
                classical_source='Classical texts',
                benefic=True
            ))

    def _detect_chandra_mangala_yoga(self):
        """Chandra Mangala Yoga: Moon and Mars conjunct or mutual aspect"""
        if self._are_planets_conjunct('Moon', 'Mars'):
            moon_house = self._get_planet_house('Moon')
            self.yogas_detected.append(Yoga(
                name='Chandra Mangala Yoga',
                type='dhana',
                description='Moon-Mars conjunction. Wealth through hard work.',
                strength='moderate',
                planets_involved=['Moon', 'Mars'],
                houses_involved=[moon_house],
                classical_source='Classical texts',
                benefic=True
            ))

    def _detect_guru_mangala_yoga(self):
        """Guru Mangala Yoga: Jupiter and Mars conjunct"""
        if self._are_planets_conjunct('Jupiter', 'Mars'):
            jup_house = self._get_planet_house('Jupiter')
            self.yogas_detected.append(Yoga(
                name='Guru Mangala Yoga',
                type='power',
                description='Jupiter-Mars conjunction. Leadership and strategic thinking.',
                strength='strong',
                planets_involved=['Jupiter', 'Mars'],
                houses_involved=[jup_house],
                classical_source='Classical texts',
                benefic=True
            ))

    def _detect_amala_yoga(self):
        """Amala Yoga: Benefics in 10th from Moon or Lagna"""
        moon_house = self._get_planet_house('Moon')
        tenth_from_moon = (moon_house + 9) % 12 + 1

        benefics = ['Jupiter', 'Venus', 'Mercury']
        for benefic in benefics:
            if self._get_planet_house(benefic) == tenth_from_moon:
                self.yogas_detected.append(Yoga(
                    name='Amala Yoga',
                    type='fame',
                    description='Benefic in 10th from Moon. Brings fame and reputation.',
                    strength='moderate',
                    planets_involved=[benefic],
                    houses_involved=[tenth_from_moon],
                    classical_source='Classical texts',
                    benefic=True
                ))
                break

    def _detect_chamara_yoga(self):
        """Chamara Yoga: Two benefics in lagna or 7th/9th/10th"""
        benefics = ['Jupiter', 'Venus', 'Mercury']
        for house in [1, 7, 9, 10]:
            benefics_in_house = []
            for benefic in benefics:
                if self._get_planet_house(benefic) == house:
                    benefics_in_house.append(benefic)

            if len(benefics_in_house) >= 2:
                self.yogas_detected.append(Yoga(
                    name='Chamara Yoga',
                    type='fame',
                    description='Two benefics in angular houses. Royal honors and fame.',
                    strength='moderate',
                    planets_involved=benefics_in_house,
                    houses_involved=[house],
                    classical_source='Classical texts',
                    benefic=True
                ))
                break

    def _detect_adhi_yoga(self):
        """Adhi Yoga: Benefics in ALL of 6th, 7th, AND 8th from Moon"""
        moon_house = self._get_planet_house('Moon')
        benefics = ['Jupiter', 'Venus', 'Mercury']

        house_6 = (moon_house + 5) % 12 + 1
        house_7 = (moon_house + 6) % 12 + 1
        house_8 = (moon_house + 7) % 12 + 1
        adhi_houses = [house_6, house_7, house_8]

        # Classical definition requires benefics in ALL THREE houses
        benefics_present = []
        houses_with_benefics = set()
        for benefic in benefics:
            benefic_house = self._get_planet_house(benefic)
            if benefic_house in adhi_houses:
                benefics_present.append(benefic)
                houses_with_benefics.add(benefic_house)

        # All three houses (6th, 7th, 8th from Moon) must have at least one benefic
        if len(houses_with_benefics) == 3:
            strength = 'strong' if len(benefics_present) == 3 else 'moderate'
            self.yogas_detected.append(Yoga(
                name='Adhi Yoga',
                type='raj',
                description='Benefics in all of 6th, 7th, and 8th from Moon. Powerful leadership qualities.',
                strength=strength,
                planets_involved=benefics_present,
                houses_involved=adhi_houses,
                classical_source='BPHS',
                benefic=True
            ))

    def _detect_kahala_yoga(self):
        """Kahala Yoga: Lords of 4th and 9th in mutual kendras"""
        lord_4 = self._get_house_lord(4)
        lord_9 = self._get_house_lord(9)

        if lord_4 and lord_9 and lord_4 in self.planets and lord_9 in self.planets:
            house_4 = self._get_planet_house(lord_4)
            house_9 = self._get_planet_house(lord_9)

            diff = abs(house_4 - house_9)
            if diff in [0, 3, 6, 9]:
                self.yogas_detected.append(Yoga(
                    name='Kahala Yoga',
                    type='raj',
                    description='Lords of 4th and 9th in mutual kendras. Success and recognition.',
                    strength='moderate',
                    planets_involved=[lord_4, lord_9],
                    houses_involved=[house_4, house_9],
                    classical_source='Classical texts',
                    benefic=True
                ))

    def _detect_vasumathi_yoga(self):
        """Vasumathi Yoga: Benefics in upachayas (3,6,10,11)"""
        benefics = ['Jupiter', 'Venus', 'Mercury']
        upachayas = [3, 6, 10, 11]

        benefics_in_upachaya = []
        for benefic in benefics:
            if self._get_planet_house(benefic) in upachayas:
                benefics_in_upachaya.append(benefic)

        if len(benefics_in_upachaya) >= 2:
            self.yogas_detected.append(Yoga(
                name='Vasumathi Yoga',
                type='dhana',
                description='Benefics in upachaya houses. Wealth through perseverance.',
                strength='moderate',
                planets_involved=benefics_in_upachaya,
                houses_involved=[self._get_planet_house(b) for b in benefics_in_upachaya],
                classical_source='Classical texts',
                benefic=True
            ))

    def _detect_parvata_yoga(self):
        """Parvata Yoga: Lagna lord and 12th lord in kendra/trikona, AND benefics in kendras"""
        benefics = ['Jupiter', 'Venus', 'Mercury']
        kendras = [1, 4, 7, 10]
        trikonas = [1, 5, 9]
        kendra_trikona = list(set(kendras + trikonas))  # [1, 4, 5, 7, 9, 10]

        # Condition 1: Lagna lord in kendra or trikona
        lord_1 = self._get_house_lord(1)
        lord_12 = self._get_house_lord(12)
        if not (lord_1 and lord_1 in self.planets and lord_12 and lord_12 in self.planets):
            return

        lord_1_house = self._get_planet_house(lord_1)
        lord_12_house = self._get_planet_house(lord_12)

        lords_in_kendra_trikona = (
            lord_1_house in kendra_trikona and lord_12_house in kendra_trikona
        )
        if not lords_in_kendra_trikona:
            return

        # Condition 2: Benefics must occupy kendras (at least 2)
        benefics_in_kendra = []
        for benefic in benefics:
            if self._get_planet_house(benefic) in kendras:
                benefics_in_kendra.append(benefic)

        if len(benefics_in_kendra) >= 2:
            all_involved = list(set([lord_1, lord_12] + benefics_in_kendra))
            self.yogas_detected.append(Yoga(
                name='Parvata Yoga',
                type='raj',
                description='Lagna and 12th lords in kendra/trikona with benefics in kendras. Fame and authority.',
                strength='moderate',
                planets_involved=all_involved,
                houses_involved=[self._get_planet_house(p) for p in all_involved],
                classical_source='Classical texts',
                benefic=True
            ))

    def _detect_neecha_bhanga_raja_yoga(self):
        """Neecha Bhanga Raja Yoga: Debilitated planet with cancellation"""
        for planet_name, planet in self.planets.items():
            if planet.dignity == 'debilitated':
                # Cancellation if lord of debilitation sign is in kendra from lagna or Moon
                debil_sign_lord = planet.sign_lord

                if debil_sign_lord in self.planets:
                    lord_house = self._get_planet_house(debil_sign_lord)
                    if lord_house in [1, 4, 7, 10]:
                        self.yogas_detected.append(Yoga(
                            name='Neecha Bhanga Raja Yoga',
                            type='raj',
                            description=f'{planet_name} debilitation cancelled. Turns weakness into strength.',
                            strength='strong',
                            planets_involved=[planet_name, debil_sign_lord],
                            houses_involved=[planet.house, lord_house],
                            classical_source='BPHS',
                            benefic=True
                        ))
                        break

    def _detect_parijata_yoga(self):
        """Parijata Yoga: Lord of sign occupied by ascendant lord in kendra/trikona"""
        lord_1 = self._get_house_lord(1)
        if lord_1 and lord_1 in self.planets:
            sign_of_lord_1 = self.planets[lord_1].sign
            lord_of_that_sign = self.planets[lord_1].sign_lord

            if lord_of_that_sign in self.planets:
                house = self._get_planet_house(lord_of_that_sign)
                if house in [1, 4, 5, 7, 9, 10]:
                    self.yogas_detected.append(Yoga(
                        name='Parijata Yoga',
                        type='raj',
                        description='Ascendant lord well-placed. Happiness and prosperity.',
                        strength='moderate',
                        planets_involved=[lord_1, lord_of_that_sign],
                        houses_involved=[house],
                        classical_source='Classical texts',
                        benefic=True
                    ))

    def _detect_kala_sarpa_yoga(self):
        """Kala Sarpa Yoga: All planets hemmed between Rahu and Ketu"""
        rahu_long = self.planets['Rahu'].longitude
        ketu_long = self.planets['Ketu'].longitude

        all_hemmed = True
        for planet_name in ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']:
            planet = self.planets[planet_name]
            long = planet.longitude

            # Check if planet is between Rahu and Ketu (clockwise)
            if rahu_long < ketu_long:
                if not (rahu_long <= long <= ketu_long):
                    all_hemmed = False
                    break
            else:
                if not (long >= rahu_long or long <= ketu_long):
                    all_hemmed = False
                    break

        if all_hemmed:
            self.yogas_detected.append(Yoga(
                name='Kala Sarpa Yoga',
                type='arishta',
                description='All planets between Rahu-Ketu axis. Challenges and transformations.',
                strength='strong',
                planets_involved=['Rahu', 'Ketu'],
                houses_involved=[self._get_planet_house('Rahu'), self._get_planet_house('Ketu')],
                classical_source='Classical texts',
                benefic=False
            ))

    def _detect_grahan_yoga(self):
        """Grahan Yoga: Sun or Moon conjunct with Rahu/Ketu"""
        if (self._are_planets_conjunct('Sun', 'Rahu', orb=5.0) or
            self._are_planets_conjunct('Sun', 'Ketu', orb=5.0)):
            self.yogas_detected.append(Yoga(
                name='Grahan Yoga (Solar)',
                type='arishta',
                description='Sun eclipsed by Rahu/Ketu. Ego challenges.',
                strength='moderate',
                planets_involved=['Sun'],
                houses_involved=[self._get_planet_house('Sun')],
                classical_source='Classical texts',
                benefic=False
            ))

        if (self._are_planets_conjunct('Moon', 'Rahu', orb=5.0) or
            self._are_planets_conjunct('Moon', 'Ketu', orb=5.0)):
            self.yogas_detected.append(Yoga(
                name='Grahan Yoga (Lunar)',
                type='arishta',
                description='Moon eclipsed by Rahu/Ketu. Emotional turbulence.',
                strength='moderate',
                planets_involved=['Moon'],
                houses_involved=[self._get_planet_house('Moon')],
                classical_source='Classical texts',
                benefic=False
            ))

    def _detect_srik_yoga(self):
        """Srik Yoga: Natural benefics in kendra from lagna lord"""
        lord_1 = self._get_house_lord(1)
        if lord_1 and lord_1 in self.planets:
            lord_1_house = self._get_planet_house(lord_1)
            benefics = ['Jupiter', 'Venus', 'Mercury']

            for benefic in benefics:
                benefic_house = self._get_planet_house(benefic)
                diff = abs(benefic_house - lord_1_house)
                if diff in [0, 3, 6, 9]:
                    self.yogas_detected.append(Yoga(
                        name='Srik Yoga',
                        type='dhana',
                        description='Benefic in kendra from lagna lord. Wealth and comfort.',
                        strength='moderate',
                        planets_involved=[lord_1, benefic],
                        houses_involved=[lord_1_house, benefic_house],
                        classical_source='Classical texts',
                        benefic=True
                    ))
                    break

    def _detect_voshi_yoga(self):
        """Voshi Yoga: Planet in 12th from Sun (except Moon)"""
        sun_house = self._get_planet_house('Sun')
        twelfth_from_sun = sun_house - 1 if sun_house > 1 else 12

        for planet_name in ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']:
            if self._get_planet_house(planet_name) == twelfth_from_sun:
                self.yogas_detected.append(Yoga(
                    name='Voshi Yoga',
                    type='knowledge',
                    description='Planet in 12th from Sun. Good speech and earning capacity.',
                    strength='weak',
                    planets_involved=[planet_name, 'Sun'],
                    houses_involved=[twelfth_from_sun, sun_house],
                    classical_source='Classical texts',
                    benefic=True
                ))
                break

    def _detect_ubhayachari_yoga(self):
        """Ubhayachari Yoga: Planets on both sides of Sun"""
        sun_house = self._get_planet_house('Sun')
        second_from_sun = (sun_house % 12) + 1
        twelfth_from_sun = sun_house - 1 if sun_house > 1 else 12

        planets_in_2nd = []
        planets_in_12th = []

        for planet_name in ['Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']:
            planet_house = self._get_planet_house(planet_name)
            if planet_house == second_from_sun:
                planets_in_2nd.append(planet_name)
            if planet_house == twelfth_from_sun:
                planets_in_12th.append(planet_name)

        if planets_in_2nd and planets_in_12th:
            self.yogas_detected.append(Yoga(
                name='Ubhayachari Yoga',
                type='knowledge',
                description='Planets on both sides of Sun. Balanced personality and success.',
                strength='moderate',
                planets_involved=planets_in_2nd + planets_in_12th + ['Sun'],
                houses_involved=[sun_house, second_from_sun, twelfth_from_sun],
                classical_source='Classical texts',
                benefic=True
            ))

    def _detect_harsha_yoga(self):
        """Harsha Yoga: Lord of 6th in 6th, 8th, or 12th"""
        lord_6 = self._get_house_lord(6)
        if lord_6 and lord_6 in self.planets:
            house = self._get_planet_house(lord_6)
            if house in [6, 8, 12]:
                self.yogas_detected.append(Yoga(
                    name='Harsha Yoga',
                    type='viparita_raj',
                    description='Lord of 6th in dusthana. Victory over enemies.',
                    strength='moderate',
                    planets_involved=[lord_6],
                    houses_involved=[house],
                    classical_source='Classical texts',
                    benefic=True
                ))

    def _detect_sarala_yoga(self):
        """Sarala Yoga: Lord of 8th in 8th, 6th, or 12th"""
        lord_8 = self._get_house_lord(8)
        if lord_8 and lord_8 in self.planets:
            house = self._get_planet_house(lord_8)
            if house in [6, 8, 12]:
                self.yogas_detected.append(Yoga(
                    name='Sarala Yoga',
                    type='viparita_raj',
                    description='Lord of 8th in dusthana. Protection from adversity.',
                    strength='moderate',
                    planets_involved=[lord_8],
                    houses_involved=[house],
                    classical_source='Classical texts',
                    benefic=True
                ))

    def _detect_vimala_yoga(self):
        """Vimala Yoga: Lord of 12th in 12th, 6th, or 8th"""
        lord_12 = self._get_house_lord(12)
        if lord_12 and lord_12 in self.planets:
            house = self._get_planet_house(lord_12)
            if house in [6, 8, 12]:
                self.yogas_detected.append(Yoga(
                    name='Vimala Yoga',
                    type='viparita_raj',
                    description='Lord of 12th in dusthana. Spiritual growth and detachment.',
                    strength='moderate',
                    planets_involved=[lord_12],
                    houses_involved=[house],
                    classical_source='Classical texts',
                    benefic=True
                ))


def detect_yogas(chart: ChartData) -> List[Yoga]:
    """Main function to detect all yogas"""
    detector = YogaDetector(chart)
    return detector.detect_all()
