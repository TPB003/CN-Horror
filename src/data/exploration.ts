// Phase 3: 3D exploration hotspot + inventory data model.
// Hotspots are bound to stations; ExploreScene renders them as 3D markers
// plus accessible HTML buttons. Items live in the backpack (InventoryPanel).

export type HotspotKind = 'investigate' | 'pickup' | 'puzzle';

export interface HotspotDef {
  /** e.g. "s05-coins" */
  id: string;
  /** e.g. "station-05" */
  stationId: string;
  kind: HotspotKind;
  /** Chinese label — used for a11y names and UI */
  label: string;
  /** Offset from the station's route point [x, y, z] in world units */
  offset: [number, number, number];
  /** Narrative text shown on investigate */
  description: string;
  /** item id granted on pickup */
  itemId?: string;
  /** puzzle id opened on activate */
  puzzleId?: string;
  /** item id that must be used on this hotspot to trigger its "solved" state */
  acceptsItem?: string;
  /** text shown when the wrong item is used */
  wrongItemText?: string;
  /** text shown when acceptsItem is used correctly (before puzzle-solved marking) */
  useItemText?: string;
  /** hotspot disappears after its one-shot action */
  once?: boolean;
}

export interface ItemDef {
  id: string;
  name: string;
  /** short examine text */
  description: string;
  /** id of a folklore codex entry for the "关联民俗" link, if any */
  folkloreRef?: string;
  /** hotspot ids this item can be used on */
  usableOn?: string[];
}

export interface CombineRecipe {
  /** two item ids (order-independent) */
  inputs: [string, string];
  /** resulting item id */
  result: string;
  /** narrative line shown on successful combine */
  text: string;
}

export const STATION_HOTSPOTS: HotspotDef[] = [
  // ---- station-01 雨夜街口 ----
  {
    id: 's01-letter',
    stationId: 'station-01',
    kind: 'pickup',
    label: '母亲的信',
    offset: [-0.5, 0.5, 0.6],
    description:
      '信没有邮戳，纸边夹着一片干槐叶，脆得一碰就碎。你展开它，字很瘦："把客簿里挤成一个人的字拆开。听见有人叫你回家，先看灯下有没有影子。"信背还有一行——"沈｜归家"，中间那道竖线细得像裂缝。',
    itemId: 'mother-letter',
    once: true,
  },
  {
    id: 's01-umbrella',
    stationId: 'station-01',
    kind: 'investigate',
    label: '齐叔的旧伞',
    offset: [0.7, 0.9, -0.3],
    description:
      '齐叔把一把透明旧伞塞进你手里，伞骨却从里面自己撑开。伞面下多出一只湿手印，正贴着你的方向。你把灯举高：三个街坊的影子都面朝巷内，只有你自己的影子还朝着街口。',
  },
  {
    id: 's01-wonton',
    stationId: 'station-01',
    kind: 'investigate',
    label: '于婶的馄饨摊',
    offset: [-1.0, 0.5, 0.2],
    description:
      '于婶递来一碗热汤，汤面还冒着气。她坚持自己只喊了"小沈"，可你分明听见，汤碗端起来之前，有人清清楚楚叫了"沈归"。锅盖的蒸汽里，三个声音挤成了同一个称呼。',
  },
  {
    id: 's01-lantern',
    stationId: 'station-01',
    kind: 'investigate',
    label: '街口暗红灯笼',
    offset: [0.2, 1.1, -0.9],
    description:
      '街口那盏暗红灯笼在雨里晃，灯下没有人，影子却先到了。你想起信上的话，先看灯下有没有影子——灯下的石板上，影子正一寸一寸朝巷内挪。',
  },

  // ---- station-02 旧书摊 ----
  {
    id: 's02-corpse-book',
    stationId: 'station-02',
    kind: 'investigate',
    label: '灯下的《尸变》',
    offset: [0.4, 0.6, 0.3],
    description:
      '陶叔把一册没有封面的旧书推到灯下，"卷一·尸变"四个小字被蜜黄灯光照得发烫。书里写蔡店临路店一夜留宿四客，女尸掀开纸衾逐个吹向床榻，天亮只剩一人归去。陶叔敲敲书页："这是蒲松龄写的故事，不是后世电影里的那套僵尸规矩，别混了。"',
  },
  {
    id: 's02-grave-photo',
    stationId: 'station-02',
    kind: 'investigate',
    label: '祖坟老照片',
    offset: [-0.6, 0.55, -0.2],
    description:
      '照片上两山夹着一道沟，沟前有水弯过去，左右山梁的松柏一深一浅。背后是母亲的字："青龙白虎砂，坟在这儿不操心。"陶叔说这是沈家祖坟的老样子——"坟是真的，\'砂能护人\'可没人敢打包票，你听个位置就行。"',
  },
  {
    id: 's02-coin-text',
    stationId: 'station-02',
    kind: 'investigate',
    label: '扉页小字',
    offset: [0.9, 0.5, -0.6],
    description:
      '缺页旧书的扉页上，有人用铅笔写着："三钱代蓍，六掷成卦。"陶叔瞥了一眼："王瞎子以前就靠这套在灵棚前混饭吃。"旧时说法里，三枚铜钱代蓍草问卦，南宋朱熹已有此说——至于掷出来算什么，那是后来的事。',
  },
  {
    id: 's02-stall',
    stationId: 'station-02',
    kind: 'investigate',
    label: '旧书堆',
    offset: [-0.2, 0.7, 0.9],
    description:
      '摊篷外的水声忽然停了。陶叔把一只从书页里按出来的手又按了回去，书堆底下压着发黄的照片和缺页的旧书。他把油灯的芯子拨亮一分："看归看，书里的东西，别往街上带。"',
  },

  // ---- station-03 旧课桌 ----
  {
    id: 's03-desk',
    stationId: 'station-03',
    kind: 'investigate',
    label: '旧课桌',
    offset: [0.3, 0.55, 0.4],
    description:
      '课桌上压着一张纸，圆珠笔倒在一边，笔尖停在"沈"字最后一笔。蓝色墨水沿一道旧水痕洇开，"沈｜归家"中间的竖线被笔尖跨了过去。你伸手去扶桌沿，桌底的木板正慢慢向上拱——没有人碰它。',
  },
  {
    id: 's03-photo',
    stationId: 'station-03',
    kind: 'investigate',
    label: '压着的合影',
    offset: [-0.7, 0.6, -0.3],
    description:
      '母亲和你的旧合影被压在纸下，正好盖住"姓名"和"去处"两栏。门外那盏薄荷绿灯开到最亮，玻璃反光里，照片上的母亲低着头，目光落在衣领内侧。',
  },
  {
    id: 's03-torn-note-a',
    stationId: 'station-03',
    kind: 'pickup',
    label: '残页·上',
    offset: [0.8, 0.3, -0.5],
    description:
      '桌缝里卡着半页纸，茬口毛着边，像从整张上撕下来的。上半截写着几个字，墨被水泡过，勉强认得出是个"栏"字。你把它抽出来，纸薄得透光。',
    itemId: 'torn-note-a',
    once: true,
  },
  {
    id: 's03-he-saying',
    stationId: 'station-03',
    kind: 'investigate',
    label: '何小满的话',
    offset: [-0.1, 0.8, 0.9],
    description:
      '何小满说，沈姨以前也替街坊看过八字，但从不给人断命，只说"命是纸，路是脚走的"。2006年那晚之后，她把命书后半本凡是断语的字全涂黑了，只留下怎么排、怎么推的字。"她说，规矩可以学，命不可以问。"',
  },

  // ---- station-04 祖宅 ----
  {
    id: 's04-manuscript',
    stationId: 'station-04',
    kind: 'investigate',
    label: '命书残页',
    offset: [0.5, 0.4, 0.6],
    description:
      '藤箱底板下还有一层。小木盒里一张命书被撕去一角：年柱"戊午"、月柱"丙辰"、日柱"甲子"还认得清，时柱处只剩毛边，断语栏全部涂黑——本作不呈现、不认可任何命理断语。母亲的小字写在边上："时上起，遁得之。"',
  },
  {
    id: 's04-lockbox',
    stationId: 'station-04',
    kind: 'puzzle',
    label: '生肖转盘锁',
    offset: [-0.6, 0.45, 0.5],
    description:
      '盒底嵌着一把三位生肖转盘锁，锁梁上刻着梁叔的字："懂规矩者开，不问命者开。"三个转盘上的生肖磨得发亮，像被无数只手拨过。你把手指搭上去，转盘冰凉。',
    puzzleId: 'manuscript-dial',
  },
  {
    id: 's04-household',
    stationId: 'station-04',
    kind: 'investigate',
    label: '旧户籍卡',
    offset: [0.9, 0.35, -0.4],
    description:
      '木盒夹层里掉出一张旧户籍卡，纸面脆得像蝉翼。"沈映禾"三个字下面，一行小字："生于戌时。"这是盒里唯一没被撕、没被涂的一句整话。',
  },
  {
    id: 's04-dress',
    stationId: 'station-04',
    kind: 'investigate',
    label: '旧红嫁衣',
    offset: [-0.9, 0.3, -0.6],
    description:
      '一件红嫁衣从箱盖滑到地上，袖口先碰到门槛，像有人正从屋里把它递出来。你翻开内衬，金线绣着三个字："顾秋禾"。衣料沉得坠手，带着樟脑和陈年雨水的气味。',
  },
  {
    id: 's04-photo',
    stationId: 'station-04',
    kind: 'investigate',
    label: '母子合影',
    offset: [0.1, 0.7, -1.0],
    description:
      '照片夹层里，母亲和八岁的你站在石墙前。背面先写着"沈映禾"，下一行才是"沈｜归家"；那道竖线不是装饰，墨迹从"沈"字下方一直连到纸边。你把红衣和照片分开放，檐水忽然从地面向上滴回屋檐。',
  },

  // ---- station-05 石街 ----
  {
    id: 's05-coins',
    stationId: 'station-05',
    kind: 'puzzle',
    label: '三枚铜钱',
    offset: [0.6, 0.4, 0.5],
    description:
      '祭案前摆着三枚磨得发亮的铜钱，字口都快磨平了。旧时说法里，三钱代蓍、六掷成卦（南宋朱熹已有此说）；游戏里把十八变三爻的揲蓍简化成了这个流程。梁叔说，这一卦是注定的——"掷出此卦＝亡魂在求祭品"只是本作的虚构说法，不断吉凶。',
    puzzleId: 'divination-kun',
  },
  {
    id: 's05-altar',
    stationId: 'station-05',
    kind: 'investigate',
    label: '祭案',
    offset: [-0.7, 0.6, -0.4],
    description:
      '灵棚下的祭案收拾得齐整：香插着，烛点着，一叠纸钱压在烛台边——只有酒盏是空的，盏底一圈干涸的酒渍。卦辞里"利用祭祀"四个字还烫着眼：祭品还没备齐，问什么都是白问。',
    acceptsItem: 'wine-jar',
    wrongItemText:
      '梁叔在棚外摇摇头："祭案上不缺这个。"他顿了顿，压低声音，"卦辞里那句怎么说的——有言不信。东西不对，说什么都没用。"',
    useItemText:
      '你提起酒壶，把酒斟进祭案上的空盏，酒面平得照出烛火。香、烛、纸钱、酒——祭品齐了。梁叔在棚外松了口气："这才叫利用祭祀。问卦问的，就是这个。"',
  },
  {
    id: 's05-wine-jar',
    stationId: 'station-05',
    kind: 'pickup',
    label: '酒壶',
    offset: [1.1, 0.35, -0.2],
    description:
      '灵棚后的木箱上放着一只陶土酒壶，壶口一圈酒渍，拿起来晃一晃，里面还有大半壶。拔开塞子，高粱酒的甜香混着雨气扑出来——这是给送行队伍备的酒，还没来得及摆上祭案。',
    itemId: 'wine-jar',
    once: true,
  },
  {
    id: 's05-wine-cup',
    stationId: 'station-05',
    kind: 'pickup',
    label: '空酒盏',
    offset: [-0.3, 0.25, 0.9],
    description:
      '石阶边倒扣着一只空酒盏，大概是被雨水冲下来的。釉面冰凉，底款磨得看不清，只剩一圈干涸的酒渍。你把它扶正，盏口正好朝向祭案的方向。',
    itemId: 'empty-wine-cup',
    once: true,
  },
  {
    id: 's05-slab',
    stationId: 'station-05',
    kind: 'investigate',
    label: '空白石板',
    offset: [0.2, 0.25, -1.1],
    description:
      '两列脚印在石板上方向相反，一红一白，却都绕开中间同一块空白石板。你蹲下来看：那块石板比周围的都干净，像被人特意空出来的。石缝里卡着半片烧了一半的纸钱。',
  },

  // ---- station-06 纸扎铺 ----
  {
    id: 's06-register',
    stationId: 'station-06',
    kind: 'investigate',
    label: '旧名册',
    offset: [0.5, 0.55, 0.4],
    description:
      '褚师傅把2006年的夜簿推到你面前。页眉两栏写着"姓名｜去处"：顾秋禾、陆守成各占一行，姓名栏却只剩被雨水洗淡的空格。同一页最下方还有母亲的登记——"沈映禾｜带幼子沈归归家"，水痕把字冲散，蓝色栏线淡成一缕。',
  },
  {
    id: 's06-invites',
    stationId: 'station-06',
    kind: 'investigate',
    label: '两张请帖',
    offset: [-0.6, 0.5, 0.3],
    description:
      '纸屋没有门，底板却能抽开，里面夹着两张被雨泡软的请帖：一张写顾秋禾，一张写陆守成。你把它们分置桌面，红影与白影也各自退到纸页两端。请帖只说明两人曾在同一夜经过客栈，不说明他们属于同一仪式。',
  },
  {
    id: 's06-paper-money',
    stationId: 'station-06',
    kind: 'pickup',
    label: '纸钱',
    offset: [0.9, 0.35, -0.5],
    description:
      '供桌边码着一摞没烧完的纸钱，纸面粗糙，边角沾着香灰。你捻起几张，纸灰簌簌地落——褚师傅摆摆手，示意你拿去："祭案上用得着的，你先拿着。"',
    itemId: 'paper-money',
    once: true,
  },
  {
    id: 's06-lantern-oil',
    stationId: 'station-06',
    kind: 'pickup',
    label: '灯油',
    offset: [-0.2, 0.3, -0.9],
    description:
      '墙角一只陶罐里装着灯油，油面浮着一层薄尘。拧开盖子，桐油的气味很正。褚师傅说这是给长明灯备的，"灯不能空，你留着，兴许哪站用得上。"',
    itemId: 'lantern-oil',
    once: true,
  },

  // ---- station-07 客栈后廊 ----
  {
    id: 's07-sleeve',
    stationId: 'station-07',
    kind: 'investigate',
    label: '白袖的黑线',
    offset: [0.4, 0.5, 0.5],
    description:
      '白衣人的袖口翻着，黑线缝着三个字："陆守成"。针脚很密，是有人一针一针缝上去的。秦姨说，这衣服是二十年前从他身上扒下来洗过又穿回去的，名字是后来才缝的——"怕他忘了自己是谁。"',
  },
  {
    id: 's07-ticket',
    stationId: 'station-07',
    kind: 'investigate',
    label: '潮烂的船票',
    offset: [-0.5, 0.45, -0.4],
    description:
      '衣领里夹着一张潮烂的船票，字迹化成一团蓝，只剩半个红戳还认得出。这是他身上唯一的东西。秦姨把它重新塞回去："留着吧，万一哪天有人来认。"',
  },
  {
    id: 's07-qi-saying',
    stationId: 'station-07',
    kind: 'investigate',
    label: '秦姨数的名字',
    offset: [0.8, 0.8, -0.6],
    description:
      '秦姨把你推进侧门，低声说："旧时说法讲，人有七魄，叫名叫不齐，魂就聚不拢。你母亲以前数过——尸狗、伏矢、雀阴、吞贼、非毒、除秽、臭肺，七个名字。"她说这是老话，信不信的，名得先记全。',
  },
  {
    id: 's07-threshold',
    stationId: 'station-07',
    kind: 'investigate',
    label: '高门槛与木闸',
    offset: [-0.8, 0.25, 0.7],
    description:
      '后廊的门槛高得硌脚。秦姨一把拉下木闸，白衣影子撞在门板上，整个走廊震了一下。门缝里，指甲刮擦的声音正慢慢靠近。你伏低身子钻过半开的侧门，耳后还留着那声响。',
  },

  // ---- station-08 旧戏台 ----
  {
    id: 's08-script',
    stationId: 'station-08',
    kind: 'investigate',
    label: '被连写的台词',
    offset: [0.5, 0.7, 0.3],
    description:
      '台词本摊在红幕前，最后一行原写着"沈｜归家"，一道红笔把竖线划掉，连成了"沈归"。墨迹很新，像是有人刚改过。你用手指描那道被划掉的竖线，纸面上有道浅浅的凹痕。',
  },
  {
    id: 's08-tape',
    stationId: 'station-08',
    kind: 'investigate',
    label: '母亲的磁带',
    offset: [-0.6, 0.5, -0.3],
    description:
      '罗婶把一盘磁带塞进放音机。先是一段戏台卸妆的动静，再是母亲的声音，一个字一个字地念："沈——映——禾。带——沈——归——归——家。"她把自己的名字和去向分开念，像怕以后有人把它们连起来。',
  },
  {
    id: 's08-seat',
    stationId: 'station-08',
    kind: 'investigate',
    label: '空座位的答应',
    offset: [0.9, 0.4, -0.7],
    description:
      '观众席最暗的空位上，木椅正慢慢向后台转过去。罗婶说那声答应不是她放的录音——放音机里，齐叔、于婶、小佟的声音轮流叫你"沈归"，却从没说过信上的完整句子。',
  },
  {
    id: 's08-torn-note-b',
    stationId: 'station-08',
    kind: 'pickup',
    label: '残页·下',
    offset: [-0.2, 0.35, 0.9],
    description:
      '木椅转过去之后，椅缝里掉出半页纸。茬口和你在旧课桌桌缝里找到的那半页严丝合缝——下半截只有一个没写完的字，墨被水泡过。你把它收好，两页纸终于凑成了一张。',
    itemId: 'torn-note-b',
    once: true,
  },

  // ---- station-09 老影院 ----
  {
    id: 's09-film',
    stationId: 'station-09',
    kind: 'investigate',
    label: '家庭胶片',
    offset: [0.3, 1.0, -0.5],
    description:
      '银幕上先出现一条黑街，再出现穿红嫁衣的顾秋禾和从港口抬来的白布担架。倒转胶片后，八岁的你追一盏滚落的红纸灯跌进港边冷水，母亲跳下石阶把你推回岸上，自己的手在下一格松开。穆师傅说，这段超自然影像是本作的虚构转译，不是历史记录。',
  },
  {
    id: 's09-projector',
    stationId: 'station-09',
    kind: 'investigate',
    label: '放映机',
    offset: [-0.7, 0.9, 0.2],
    description:
      '穆师傅把放映室的暗红灯调低，检修桥上的放映机转得发烫。胶片一格一格走过放映窗，"缺失的一格"处，画面抖了一下——母亲的全名和"归家"两栏留在最后一格。',
  },
  {
    id: 's09-mother-desk',
    stationId: 'station-09',
    kind: 'investigate',
    label: '母亲涂命书的一格',
    offset: [0.8, 0.5, 0.6],
    description:
      '胶片切到一间灯下：母亲坐在藤箱前，手里是一本命书。她一页页翻过，凡是断语的字全涂黑了，只留下怎么排、怎么推的字。穆师傅把画面定住："她涂的时候很慢，像在跟谁告别。"',
  },
  {
    id: 's09-seats',
    stationId: 'station-09',
    kind: 'investigate',
    label: '空影院',
    offset: [-0.1, 0.45, 1.0],
    description:
      '观众席空无一人，座椅扶手上积着灰，地上有几枚2006年的电影票根。你坐下来，银幕的光在你脸上明明灭灭——这一排座位，大概很久没人坐过了。',
  },

  // ---- station-10 游戏铺 ----
  {
    id: 's10-machine',
    stationId: 'station-10',
    kind: 'investigate',
    label: '故障街机',
    offset: [0.4, 0.8, 0.3],
    description:
      '街机屏幕显示九格地图，三个路口都挂着橙灯，最远一格却有一盏不该出现的白灯。你按下向前，角色走了四步又回到原点；屏幕上你的姓名栏自动填入"沈归"。小陆说，这机器拔了电源也照样转。',
  },
  {
    id: 's10-save',
    stationId: 'station-10',
    kind: 'investigate',
    label: '第三次存档',
    offset: [-0.5, 0.85, -0.2],
    description:
      '第三次回到街口时，存档日期从2026退到2006。纸面般的屏幕突然向外凸起，一只灰白手掌从像素格里抓住角色——手腕上缝着"陆守成"，而屏幕存档清晰写着"沈｜归家"。系统把竖线抹掉后，才显示"沈归"。',
  },
  {
    id: 's10-token',
    stationId: 'station-10',
    kind: 'pickup',
    label: '游戏币',
    offset: [0.9, 0.5, -0.5],
    description:
      '小陆把最后一枚代币推给你。币面上的字磨平了，边齿还带着机房的机油味。你把它攥在手心，金属凉得像刚从2006年拿出来。',
    itemId: 'arcade-token',
    once: true,
  },
  {
    id: 's10-key',
    stationId: 'station-10',
    kind: 'pickup',
    label: '旧钥匙',
    offset: [-0.2, 0.4, 0.9],
    description:
      '白灯把你引进仓房，你却从游戏铺前柜的抽屉里走了出来。小陆从抽屉里摸出一把旧钥匙递给你：钥匙齿上刻着旅社账房的编号，铜把手上还有"梁记"两个小字。',
    itemId: 'old-key',
    once: true,
  },

  // ---- station-11 旅社账簿 ----
  {
    id: 's11-ledger',
    stationId: 'station-11',
    kind: 'investigate',
    label: '旅社夜簿',
    offset: [0.4, 0.6, 0.4],
    description:
      '旧钥匙打开后账房，秦姨和梁叔正在等。桌上铺着三样东西：旧名册、母亲的照片、旅社夜簿。夜簿上顾秋禾、陆守成两行被雨洗空；母亲把自己的名字写在同行人栏，为落水的八岁孩子登记"带沈归归家"——梁叔誊本时只看清"沈"和"归家"，误把姓名与去向合成了一个名字。',
    acceptsItem: 'mended-note',
    wrongItemText:
      '梁叔把东西推回来："这时候往簿子上添别的东西，只会更乱。"他指指那两行被雨洗空的名字，"先把名字弄对，再谈别的。"',
    useItemText:
      '你把拼好的纸条按在夜簿"沈归"那行旁边。纸条上没写完的半句话正好接上："栏分开，名叫全。"梁叔盯着看了很久，点点头："对——\'沈\'归\'沈\'，\'归家\'归\'归家\'。"窗外，黑白无常的追索单上，两个名字终于分开了栏。',
  },
  {
    id: 's11-liang',
    stationId: 'station-11',
    kind: 'investigate',
    label: '梁叔',
    offset: [-0.6, 0.7, -0.2],
    description:
      '梁叔从怀里摸出一把铜钥匙，钥匙柄上刻着"梁记"。"我二十年前是锁匠，后来只敢抄簿。"他说，"当年立祠堂，请人拿土圭定了向的——向定了，路就不会错。可我抄簿的时候，把字看错了。"他把钥匙放在桌上，"藤箱上的转盘锁，是我给沈映禾造的最后一把。她说，锁不用钥匙，用规矩开。"',
  },
  {
    id: 's11-window',
    stationId: 'station-11',
    kind: 'investigate',
    label: '窗外灵棚',
    offset: [0.9, 1.0, -0.6],
    description:
      '梁叔看了一眼窗外灵棚的方向："棚里的祭案，酒添上了？"你点头。他苦笑："那就好。王瞎子说过，祭品不齐，问什么都是\'有言不信\'。"棚里的烛火隔着窗纸，一盏一盏稳着。',
  },
  {
    id: 's11-abacus',
    stationId: 'station-11',
    kind: 'investigate',
    label: '账房算盘',
    offset: [-0.3, 0.8, 0.8],
    description:
      '后账房的墙上挂着一把算盘，珠子落了一层灰。梁叔说，二十年前他就是坐在这儿，一笔一笔把夜簿誊错的。算珠拨回去容易，写错的字，却要在二十年后才有人来拆。',
  },

  // ---- station-12 黎明双结局 ----
  {
    id: 's12-lamps',
    stationId: 'station-12',
    kind: 'puzzle',
    label: '七盏灯',
    offset: [0.0, 0.35, 0.8],
    description:
      '门槛两侧不知何时多出七盏没点亮的灯，一字排开。白无常把灯芯挑亮一分："七魄各有其名，名齐了，路才齐。"你想起秦姨在后廊数过的七个名字——尸狗、伏矢、雀阴、吞贼、非毒、除秽、臭肺。七魄名目出自古籍《云笈七签》，是旧时的说法；"按此顺序点灯即安魂"只是本作的虚构规则，只作用于故事里的人。',
    puzzleId: 'seven-lamps',
  },
  {
    id: 's12-lantern-brass',
    stationId: 'station-12',
    kind: 'investigate',
    label: '黄铜煤油灯',
    offset: [0.0, 0.4, -0.3],
    description:
      '门槛中央那盏黄铜煤油灯还没有点亮。红灯照着姓名栏，白灯照着去向栏，母亲站在灯后，湿发贴着衣领。她把你推上石阶时，自己的名字正从夜簿上被雨抹去。',
  },
  {
    id: 's12-ledgers',
    stationId: 'station-12',
    kind: 'investigate',
    label: '夜簿与追索单',
    offset: [-0.8, 0.3, 0.2],
    description:
      '被雨水涂开的夜簿摊在门槛上，旁边是黑白无常放下的追索单。你已经能把三个名字写回去：顾秋禾、陆守成各归各的栏，母亲沈映禾的那一行，"姓名"与"去处"终于分开。黑无常把墨笔递到你手边。',
  },
  {
    id: 's12-threshold',
    stationId: 'station-12',
    kind: 'investigate',
    label: '门槛',
    offset: [0.8, 0.3, -0.5],
    description:
      '天快亮了。门左的红灯和门右的白灯同时爆出一声脆响，灯芯齐齐熄灭；黑暗里一张湿白的脸贴上门缝，海水从门槛下漫进来。两条路在你面前分开：带母亲离开，或接过她守了二十年的灯。',
  },
];

export const ITEMS: Record<string, ItemDef> = {
  'wine-jar': {
    id: 'wine-jar',
    name: '酒壶',
    description:
      '陶土酒壶，壶口一圈酒渍。晃一晃，里面还有大半壶——高粱酒的甜香混着雨气。',
    usableOn: ['s05-altar'],
  },
  'empty-wine-cup': {
    id: 'empty-wine-cup',
    name: '空酒盏',
    description: '一只小酒盏，釉面冰凉，底款磨得看不清。盏口正好朝向祭案的方向，像在等酒。',
  },
  'wine-cup-filled': {
    id: 'wine-cup-filled',
    name: '盛满酒的酒盏',
    description: '酒入盏，盏满而不溢。酒面平得照出烛火，端在手里稳得不晃。',
    usableOn: ['s05-altar'],
  },
  'torn-note-a': {
    id: 'torn-note-a',
    name: '残页·上',
    description:
      '从旧课桌桌缝里抽出的半页纸，茬口毛着边。上半截几个字被水泡过，勉强认得出一个"栏"字。',
  },
  'torn-note-b': {
    id: 'torn-note-b',
    name: '残页·下',
    description:
      '旧戏台木椅缝里掉出的半页纸。下半截只有一个没写完的字，茬口和桌缝里那半页严丝合缝。',
  },
  'mended-note': {
    id: 'mended-note',
    name: '拼好的纸条',
    description:
      '两页纸拼成了一张。上面是没写完的半句话："……栏分开，名叫全。\'沈\'是姓，\'归家\'是去处，别——"字迹和客簿上的誊写一模一样。这句话，是写给旅社夜簿看的。',
    folkloreRef: 'F04',
  },
  'paper-money': {
    id: 'paper-money',
    name: '纸钱',
    description: '一摞没烧完的纸钱，纸面粗糙，边角沾着香灰。捻起来簌簌地落灰。',
    folkloreRef: 'L10',
  },
  'lantern-oil': {
    id: 'lantern-oil',
    name: '灯油',
    description: '陶罐装的灯油，油面浮着一层薄尘。拧开盖，桐油气味很正——是给长明灯备的。',
    folkloreRef: 'O06',
  },
  'mother-letter': {
    id: 'mother-letter',
    name: '母亲的信',
    description:
      '没有邮戳的信，纸边夹着一片干槐叶。"把客簿里挤成一个人的字拆开。听见有人叫你回家，先看灯下有没有影子。"信背写着"沈｜归家"。',
  },
  'arcade-token': {
    id: 'arcade-token',
    name: '游戏币',
    description: '小陆给的最后一枚代币。币面上的字磨平了，边齿还带着机房的机油味，凉得像刚从2006年拿出来。',
  },
  'old-key': {
    id: 'old-key',
    name: '旧钥匙',
    description: '钥匙齿上刻着旅社账房的编号，铜把手上还有"梁记"两个小字。分量压手，是老师傅的手艺。',
  },
};

export const RECIPES: CombineRecipe[] = [
  {
    inputs: ['wine-jar', 'empty-wine-cup'],
    result: 'wine-cup-filled',
    text: '酒入盏，盏满而不溢。去祭案前把这盏酒补上吧。',
  },
  {
    inputs: ['torn-note-a', 'torn-note-b'],
    result: 'mended-note',
    text: '两页纸的茬口严丝合缝。上面是半句没写完的话，字迹和客簿上的一样。',
  },
];

export function hotspotsFor(stationId: string): HotspotDef[] {
  return STATION_HOTSPOTS.filter((h) => h.stationId === stationId);
}

export function itemDef(id: string): ItemDef | undefined {
  return ITEMS[id];
}
