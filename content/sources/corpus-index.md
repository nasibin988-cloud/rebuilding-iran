# Corpus Index & Organization System
## Rebuilding Iran Educational Content Sources

This document establishes the system for organizing, indexing, and retrieving content from the source corpus.

---

## File Organization Structure

```
content/
└── sources/
    ├── master-book-list.md          # This catalog
    ├── anna-archive-search.txt      # Search queries
    ├── corpus-index.md              # This indexing system
    │
    ├── raw/                         # Original downloaded files
    │   ├── philosophy/
    │   ├── constitutional/
    │   ├── transitions/
    │   ├── iran/
    │   ├── shia/
    │   ├── law/
    │   ├── electoral/
    │   ├── civil-society/
    │   ├── economics/
    │   ├── human-rights/
    │   ├── regional/
    │   ├── governance/
    │   ├── nationalism/
    │   ├── international/
    │   ├── religion/
    │   ├── education/
    │   ├── gender/
    │   ├── technology/
    │   ├── persian/
    │   ├── primary-documents/
    │   └── supplementary/
    │
    ├── processed/                   # Converted to markdown/text
    │   └── [same structure as raw]
    │
    └── index/                       # Machine-readable indices
        ├── metadata.json            # Full metadata for all sources
        ├── by-topic.json            # Sources grouped by topic
        ├── by-figure.json           # Sources mentioning key figures
        ├── by-period.json           # Sources by historical period
        ├── by-region.json           # Sources by geographic focus
        └── citations.json           # Pre-formatted citations
```

---

## Metadata Schema

Each source will have a metadata entry in the following format:

```json
{
  "id": "dahl-on-democracy-1998",
  "title": "On Democracy",
  "author": ["Robert Dahl"],
  "year": 1998,
  "type": "book",
  "tier": 1,
  "language": "en",
  "file_path": "processed/philosophy/dahl-on-democracy-1998.md",

  "topics": [
    "democratic-theory",
    "polyarchy",
    "participation",
    "representation"
  ],

  "figures": [],

  "periods": [
    "contemporary"
  ],

  "regions": [
    "general"
  ],

  "keywords": [
    "democracy",
    "democratic institutions",
    "political equality",
    "citizen participation",
    "polyarchy"
  ],

  "citation": {
    "chicago": "Dahl, Robert A. *On Democracy*. New Haven: Yale University Press, 1998.",
    "short": "Dahl 1998"
  },

  "relevance": {
    "flashcards": true,
    "quizzes": true,
    "scenarios": true,
    "lectures_simple": true,
    "lectures_scholarly": true
  },

  "chapters": [
    {
      "number": 1,
      "title": "Do We Really Need a Guide?",
      "topics": ["democratic-theory"],
      "page_start": 1
    }
  ]
}
```

---

## Topic Taxonomy

### Level 1: Major Categories

| Code | Category |
|------|----------|
| POL | Political Philosophy & Theory |
| CON | Constitutional Design & Law |
| TRA | Transitions & Democratization |
| IRN | Iranian History & Politics |
| SHI | Shia Islam & Religious Politics |
| LAW | Rule of Law & Judicial Systems |
| ELE | Electoral Systems & Parties |
| CIV | Civil Society & Participation |
| ECO | Economics & Development |
| HUM | Human Rights |
| REG | Regional Studies |
| GOV | Practical Governance |
| NAT | Nationalism & Identity |
| INT | International Relations |
| REL | Religion & Politics |
| EDU | Education & Socialization |
| GEN | Gender & Politics |
| TEC | Technology & Governance |
| PER | Persian Sources |
| PRI | Primary Documents |

### Level 2: Sub-Topics (Examples)

**POL: Political Philosophy**
- POL.CLA - Classical (Plato, Aristotle)
- POL.ENL - Enlightenment (Locke, Montesquieu, Rousseau)
- POL.LIB - Liberalism (Mill, Rawls)
- POL.REP - Republicanism (Pettit, Skinner)
- POL.DEL - Deliberative Democracy (Habermas, Fishkin)
- POL.PAR - Participatory Democracy (Pateman, Barber)
- POL.TOT - Totalitarianism Critique (Arendt, Popper)

**IRN: Iranian History**
- IRN.ANC - Ancient Persia (Achaemenid, Sasanian)
- IRN.MED - Medieval Islamic Period
- IRN.QAJ - Qajar Period
- IRN.CON - Constitutional Revolution 1906-1911
- IRN.PAH - Pahlavi Era
- IRN.REV - 1979 Revolution
- IRN.ISR - Islamic Republic
- IRN.REF - Reform Movement
- IRN.GRN - Green Movement & After
- IRN.DIA - Diaspora

**TRA: Transitions**
- TRA.THE - Transition Theory
- TRA.CON - Consolidation
- TRA.BAC - Backsliding & Erosion
- TRA.TRJ - Transitional Justice

---

## Key Figures Index

Sources are tagged by which historical/political figures they substantially discuss:

### Iranian Figures
- `MOSSADEGH` - Mohammad Mosaddegh
- `KHOMEINI` - Ruhollah Khomeini
- `SHARIATI` - Ali Shariati
- `SOROUSH` - Abdolkarim Soroush
- `KASRAVI` - Ahmad Kasravi
- `BAZARGAN` - Mehdi Bazargan
- `KADIVAR` - Mohsen Kadivar
- `GANJI` - Akbar Ganji
- `KHATAMI` - Mohammad Khatami
- `PAHLAVI_R` - Reza Shah
- `PAHLAVI_M` - Mohammad Reza Shah
- `NASER` - Naser al-Din Shah

### Political Philosophers
- `ARISTOTLE`
- `PLATO`
- `LOCKE`
- `MONTESQUIEU`
- `ROUSSEAU`
- `MILL`
- `TOCQUEVILLE`
- `ARENDT`
- `RAWLS`
- `HABERMAS`

### Transition Figures
- `MANDELA`
- `WALESA`
- `HAVEL`
- `SUAREZ` - Adolfo Suárez (Spain)

---

## Historical Periods

| Code | Period | Years |
|------|--------|-------|
| ANC | Ancient | Before 650 CE |
| MED | Medieval | 650-1500 |
| EAM | Early Modern | 1500-1789 |
| REV | Revolutionary Era | 1789-1848 |
| LAT | Late 19th Century | 1848-1914 |
| WAR | World Wars Era | 1914-1945 |
| COL | Cold War | 1945-1991 |
| POS | Post-Cold War | 1991-2010 |
| CON | Contemporary | 2010-present |

### Iranian-Specific Periods

| Code | Period | Years |
|------|--------|-------|
| IRN.ACH | Achaemenid | 550-330 BCE |
| IRN.SAS | Sasanian | 224-651 CE |
| IRN.ISL | Early Islamic | 651-1500 |
| IRN.SAF | Safavid | 1501-1736 |
| IRN.QAJ | Qajar | 1789-1925 |
| IRN.CR | Constitutional Revolution | 1905-1911 |
| IRN.PA1 | Reza Shah | 1925-1941 |
| IRN.PA2 | Mohammad Reza Shah | 1941-1979 |
| IRN.REV | Revolution | 1978-1979 |
| IRN.KHO | Khomeini Era | 1979-1989 |
| IRN.POS | Post-Khomeini | 1989-1997 |
| IRN.REF | Reform Era | 1997-2005 |
| IRN.AHM | Ahmadinejad Era | 2005-2013 |
| IRN.ROU | Rouhani Era | 2013-2021 |
| IRN.RAI | Raisi Era | 2021-present |

---

## Regional Focus

| Code | Region |
|------|--------|
| GLO | Global/Comparative |
| EUR | Europe (General) |
| EUR.W | Western Europe |
| EUR.E | Eastern/Central Europe |
| EUR.S | Southern Europe |
| AME | Americas |
| AME.N | North America |
| AME.L | Latin America |
| ASI | Asia |
| ASI.E | East Asia |
| ASI.SE | Southeast Asia |
| ASI.S | South Asia |
| MEN | Middle East & North Africa |
| MEN.IR | Iran |
| MEN.AR | Arab World |
| MEN.TU | Turkey |
| AFR | Sub-Saharan Africa |

---

## Source Tiers

### Tier 1: Essential (~100 works)
Foundational texts every serious student must know. These form the backbone of citations.

**Examples:**
- Aristotle, *Politics*
- Locke, *Two Treatises*
- Tocqueville, *Democracy in America*
- Dahl, *On Democracy*
- Abrahamian, *Iran Between Two Revolutions*
- Rawls, *A Theory of Justice*
- Linz & Stepan, *Problems of Democratic Transition*

### Tier 2: Important (~200 works)
Key secondary literature that deepens understanding. Regular citation sources.

**Examples:**
- Pateman, *Participation and Democratic Theory*
- Sunstein, *Designing Democracy*
- Bayat, *Making Islam Democratic*
- Chenoweth & Stephan, *Why Civil Resistance Works*

### Tier 3: Specialized (~500 works)
Topic-specific works for comprehensive coverage. Cited for specialized topics.

**Examples:**
- Regional case studies
- Biographies
- Specific policy analyses
- Methodological works

---

## Content Type Mapping

Which sources are relevant for which app content types:

### Flashcards
- **Best sources:** Textbooks, introductions, handbooks
- **Citation style:** Single source per card, chapter level
- **Example:** "The concept of 'polyarchy' refers to..." (Dahl 1998, Ch. 8)

### Quizzes
- **Best sources:** Same as flashcards, plus case studies
- **Citation style:** Question stems may cite, answers cite supporting source
- **Example:** Q: "According to Huntington, the 'third wave' of democratization began in which country?" A: "Portugal, 1974" (Huntington 1991, Ch. 1)

### Scenarios
- **Best sources:** Case studies, transition analyses, historical accounts
- **Citation style:** Synthesized from multiple sources
- **Example:** Scenario about constitutional assembly → cite Elster, Ackerman, Ginsburg

### Simple Lectures
- **Best sources:** Accessible introductions, popular histories
- **Citation style:** Light citation, chapter-level
- **Example:** Narrative draws from Axworthy's *History of Iran* with occasional citations

### Scholarly Lectures
- **Best sources:** Academic monographs, peer-reviewed works
- **Citation style:** Dense citation, page-level where needed, direct quotes
- **Example:** Academic analysis with footnotes citing specific arguments

---

## Search Queries

When looking for sources on a topic, use these pre-defined queries:

### By Concept
```
Find sources on: "separation of powers"
→ Filter: topics contains "separation-of-powers" OR "constitutional-design" OR keywords contains "separation of powers"
```

### By Figure
```
Find sources about: Mosaddegh
→ Filter: figures contains "MOSSADEGH" OR keywords contains "Mosaddegh" OR keywords contains "Mossadeq"
```

### By Event
```
Find sources on: Constitutional Revolution
→ Filter: periods contains "IRN.CR" OR topics contains "constitutional-revolution" OR keywords contains "constitutional revolution"
```

### By Country Transition
```
Find sources on: Spanish transition
→ Filter: regions contains "EUR.S" AND topics contains "transitions"
```

---

## Processing Pipeline

### Step 1: Download
- Download from Anna's Archive using search queries
- Save to `raw/[category]/` with filename: `author-short-title-year.ext`
- Example: `raw/iran/abrahamian-iran-between-two-revolutions-1982.pdf`

### Step 2: Convert
Run conversion script to produce clean text:
```bash
# PDF to text (OCR if needed)
# EPUB to markdown
# Already-text files: clean up formatting
```
- Save to `processed/[category]/author-short-title-year.md`

### Step 3: Index
For each source, create metadata entry:
- Extract chapter structure
- Assign topics, figures, periods, regions
- Generate citations
- Add to `index/metadata.json`

### Step 4: Cross-Reference
Build secondary indices:
- Group by topic → `index/by-topic.json`
- Group by figure → `index/by-figure.json`
- Group by period → `index/by-period.json`
- Group by region → `index/by-region.json`

---

## Citation Formats

### In-Text (Superscript)
Content appears like this with citations.¹ Multiple citations group together.²³

### Reference Section Format

**For Books:**
> ¹ Dahl, Robert A. *On Democracy*. New Haven: Yale University Press, 1998. Ch. 4.

**For Edited Volumes:**
> ² Stepan, Alfred. "Religion, Democracy, and the 'Twin Tolerations.'" In *World Religions and Democracy*, edited by Larry Diamond et al., 3-23. Baltimore: Johns Hopkins University Press, 2005.

**For Articles:**
> ³ Rustow, Dankwart. "Transitions to Democracy: Toward a Dynamic Model." *Comparative Politics* 2, no. 3 (1970): 337-363.

**For Primary Documents:**
> ⁴ *Constitution of the Islamic Republic of Iran* (1979, amended 1989), Article 57.

---

## Quality Assurance Checklist

Before using a source for content creation:

- [ ] File successfully converted to text
- [ ] Metadata entry complete
- [ ] Topics accurately assigned
- [ ] Key figures identified
- [ ] Tier level assigned
- [ ] Citation formatted
- [ ] Relevance tags set

---

## Maintenance

### Adding New Sources
1. Download to `raw/`
2. Convert to `processed/`
3. Create metadata entry
4. Update indices
5. Verify quality

### Updating Content
When app content is updated:
1. Review which sources are cited
2. Verify citations are accurate
3. Update citation counts in metadata

---

*Last updated: February 2026*
