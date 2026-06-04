/**
 * 镇武孤城 - 剧情系统
 *
 * 叙事架构：以"城主"视角展开，从初入废墟到重建镇武城的完整故事线。
 * 剧情推进与游戏里程碑绑定（建筑等级、英雄数量、探索进度等）。
 */

export interface StoryChoice {
  id: string;
  text: string;
  effect?: {
    resources?: Partial<Record<'bingxiang' | 'iron' | 'meteorite' | 'food' | 'wood' | 'population', number>>;
    unlockHero?: string;   // 解锁指定英雄加入酒馆池
    storyFlag?: string;    // 设置剧情标记
  };
  nextChapterId: string;
}

export interface StoryChapter {
  id: string;
  act: number;             // 幕 (1-5)
  chapter: number;         // 章 (每幕内编号)
  title: string;
  subtitle: string;
  scene: string;           // 场景描述（氛围文字）
  narrator: string;        // 叙述者
  content: string[];       // 剧情文本段落
  choices?: StoryChoice[]; // 分支选项（可选）
  nextChapterId: string;   // 默认下一章
  trigger: {
    type: 'auto' | 'manual' | 'milestone';
    /** 里程碑类型触发条件 */
    milestoneType?: 'first_login' | 'building_level' | 'hero_count' | 'first_battle' |
      'first_boss' | 'explore_floor' | 'forge_count' | 'total_level' | 'achievement';
    /** 里程碑数值 */
    milestoneValue?: number;
    /** 里程碑目标key */
    milestoneKey?: string;
  };
  rewards?: {
    bingxiang?: number;
    iron?: number;
    food?: number;
    wood?: number;
    meteorite?: number;
    population?: number;
  };
  backgroundMusic?: string;
  illustration?: string;    // 场景插图描述（预留）
}

/** 剧情状态 */
export interface StoryState {
  currentChapterId: string;
  completedChapterIds: string[];
  unlockedChapterIds: string[];
  storyFlags: Record<string, boolean>;     // 剧情标记（分支用）
  readChoices: Record<string, string>;      // 玩家做过的选择 chapterId -> choiceId
  lastReadTime: number;
}

// ============================================================
// 第一幕：孤城初现
// ============================================================

export const STORY_CHAPTERS: Record<string, StoryChapter> = {

  // ---- 序章：风雪夜归人 ----
  prologue: {
    id: 'prologue',
    act: 1,
    chapter: 0,
    title: '序章',
    subtitle: '风雪夜归人',
    scene: '漫天飞雪中，一座残破的城池轮廓隐约可见。城门半塌，旌旗斜挂。远处传来狼嚎。',
    narrator: '旁白',
    content: [
      '永安四年，冬。',
      '你策马穿行于茫茫雪原，身后是追兵的火把，前方是传说中的"镇武城"——一座在战乱中被遗弃的孤城。',
      '传说这里曾屯驻过前朝最精锐的"镇武军"，城破之后，城中宝藏与秘密一同埋葬于废墟之下。',
      '而今，你是唯一一个知道这座城还存在的人。',
      '城门处，一个裹着破旧蓑衣的老者正在扫雪。他抬起头，浑浊的眼睛闪过一丝精光。',
      '"将军，老朽在此等候多时了。"',
    ],
    nextChapterId: 'act1_ch1',
    trigger: { type: 'auto' },
    rewards: { bingxiang: 500, food: 500, wood: 300, iron: 100 },
  },

  // ---- 第一章：百废待兴 ----
  act1_ch1: {
    id: 'act1_ch1',
    act: 1,
    chapter: 1,
    title: '第一章',
    subtitle: '百废待兴',
    scene: '城内一片萧条。断壁残垣间，几户人家蜷缩在破屋之中。老者引你来到城中央的府衙。',
    narrator: '陈伯',
    content: [
      '老者自称陈伯，是镇武城最后的守城人。他带你穿过荒废的街道，来到城中央的府衙。',
      '"将军请看。这镇武城虽已破败，但根基尚在。民房可修缮以纳流民，农田可开垦以充仓廪，伐木场和铁矿……呵，那些都在城外，需要将军亲自去收复。"',
      '陈伯指向府衙墙上的一幅残破地图。',
      '"城东的黑风山寨盘踞已久，那里的山贼经常劫掠过往商旅。城南有一座废弃的铁矿，曾被一伙披甲悍匪占据。至于更远的地方……"',
      '他顿了顿，压低声音。',
      '"传说前朝覆灭时，最后的皇室成员带着大量财宝逃入了深山中的密库。而那座旧都的入口，就在这片废墟的最深处。"',
      '"但现在，最重要的是——让这座城重新活过来。"',
    ],
    choices: [
      {
        id: 'choice_act1_1_a',
        text: '"我先去看看城内的情况，了解清楚再作打算。"',
        nextChapterId: 'act1_ch2_cautious',
        effect: { storyFlag: 'cautious_leader' },
      },
      {
        id: 'choice_act1_1_b',
        text: '"立刻整顿城防！先招募可用之人，再图后计。"',
        nextChapterId: 'act1_ch2_bold',
        effect: { storyFlag: 'bold_leader', unlockHero: 'tieshan' },
      },
    ],
    nextChapterId: 'act1_ch2_cautious',
    trigger: { type: 'auto' },
  },

  // ---- 第一章分支：谨慎路线 ----
  act1_ch2_cautious: {
    id: 'act1_ch2_cautious',
    act: 1,
    chapter: 2,
    title: '第一章·续',
    subtitle: '审时度势',
    scene: '你在城中巡视了一圈。虽然满目疮痍，但你看到了希望——城墙的主体结构依然完整，水井尚未干涸。',
    narrator: '旁白',
    content: [
      '你花了整整一天时间走遍了城中的每一个角落。',
      '城墙虽有破损，但主体结构依然坚固。三口水井中还有两口能打出清水来。城西的一片空地上，甚至还有人种着几畦蔬菜。',
      '更重要的是，你在城中的客栈废墟里发现了一个沉默寡言的大汉。他自称铁山，说是前朝禁军的后裔，战乱时流落至此。',
      '"我要重建这座城。"你对他说。',
      '铁山看了你许久，缓缓点头："好。我跟你。"',
    ],
    nextChapterId: 'act1_ch3',
    trigger: { type: 'auto' },
    rewards: { bingxiang: 200, population: 20 },
  },

  // ---- 第一章分支：果敢路线 ----
  act1_ch2_bold: {
    id: 'act1_ch2_bold',
    act: 1,
    chapter: 2,
    title: '第一章·续',
    subtitle: '招兵买马',
    scene: '你下令张榜招贤。消息传开后，城中渐渐有了人气。',
    narrator: '旁白',
    content: [
      '"镇武城招贤！"告示贴出的第三天，府衙门前排起了长队。',
      '第一个走上前的，是一个身材魁梧、沉默寡言的大汉。他浑身散发着铁一般的气息。',
      '"铁山。前朝禁军。"他只说了这几个字，便站在了一旁，像一尊铁塔。',
      '陈伯在你耳边低语："此人忠厚可靠，是个难得的将才。将军眼光不错。"',
      '紧接着，更多的流民和游侠闻讯而来。这座死寂的城市，终于又有了人声。',
    ],
    nextChapterId: 'act1_ch3',
    trigger: { type: 'auto' },
    rewards: { bingxiang: 300, population: 50 },
  },

  // ---- 第三章：第一滴血 ----
  act1_ch3: {
    id: 'act1_ch3',
    act: 1,
    chapter: 3,
    title: '第三章',
    subtitle: '第一滴血',
    scene: '斥候来报：黑风寨的小股匪徒正在逼近城外村落。这是你接管镇武城后的第一次战斗。',
    narrator: '旁白',
    content: [
      '"报——！黑风寨匪徒约十余人，正在劫掠城东村落！"',
      '这是你的第一场仗。铁山已经披上了他那副斑驳的铁甲，手中握着一根粗大的铁棍。',
      '"将军，"他声音低沉，"我打前锋。"',
      '陈伯递给你一张布阵图："镇武军的战法讲究因地制宜。前排扛伤，后排输出，灵活者伺机切后。记住这个道理，日后遇到更强的敌人也用得上。"',
      '窗外，喊杀声越来越近。',
      '是你的时候了——出发吧，城主。',
    ],
    nextChapterId: 'act1_ch4',
    trigger: { type: 'milestone', milestoneType: 'hero_count', milestoneValue: 1 },
    rewards: { iron: 50, bingxiang: 100 },
  },

  // ---- 第四章：初战告捷 ----
  act1_ch4: {
    id: 'act1_ch4',
    act: 1,
    chapter: 4,
    title: '第四章',
    subtitle: '初战告捷',
    scene: '硝烟散去，匪徒溃逃。你站在战场中央，铁山正在清点缴获物资。',
    narrator: '旁白',
    content: [
      '战斗结束得比预想中更快。',
      '那些流寇虽然凶狠，但毫无纪律可言。铁山冲在最前面，硬生生扛住了大部分攻击，而你指挥若定，找准时机给了对方致命一击。',
      '"初次上阵，能有这般表现，已是不易。"陈伯不知何时来到了战场上，手里提着一壶酒，"来，喝一杯。从今天起，这一带的人会知道——镇武城，有新主人了。"',
      '你接过酒碗，望着远处那片连绵的山脉。黑风寨的本寨还在更深的地方，而那座废弃的铁矿……也在那里。',
      '路，才刚刚开始。',
    ],
    nextChapterId: 'act2_ch1',
    trigger: { type: 'milestone', milestoneType: 'first_battle', milestoneValue: 1 },
    rewards: { iron: 100, meteorite: 2, bingxiang: 150 },
  },

  // ============================================================
  // 第二幕：群雄汇聚
  // ============================================================

  // ---- 第五章：酒馆来客 ----
  act2_ch1: {
    id: 'act2_ch1',
    act: 2,
    chapter: 1,
    title: '第五章',
    subtitle: '酒馆来客',
    scene: '城中开起了一家简陋的酒馆。这天夜里，三个不速之客推门而入。',
    narrator: '旁白',
    content: [
      '随着镇武城的名声逐渐传开，各路人马开始向这里汇聚。',
      '最先到来的是一个刀客。他叫柳一刀，整日醉醺醺的，却没人见过他拔刀的样子。他说他在找一种"能让他全力以赴的对手"。',
      '第二个是一个身手矫健的年轻女子，名叫云娘。她是边陲猎户的女儿，追踪一群掠走她乡亲的匪徒到了这里。听说你要剿灭黑风寨，她决定留下来帮忙。',
      '第三个……第三个让你有些意外。',
      '那是一个面容威武的中年男子，眉宇间带着一股不怒自威的气势。他自称关胜，绰号"大刀"。',
      '"听闻将军在重振镇武军，"他的声音洪亮如钟，"某家不才，愿效犬马之劳。"',
    ],
    nextChapterId: 'act2_ch2',
    trigger: { type: 'milestone', milestoneType: 'hero_count', milestoneValue: 3 },
    rewards: { bingxiang: 300, food: 200 },
  },

  // ---- 第六章：黑风山寨 ----
  act2_ch2: {
    id: 'act2_ch2',
    act: 2,
    chapter: 2,
    title: '第六章',
    subtitle: '黑风破晓',
    scene: '黑风山寨的主寨矗立在悬崖之上。寨门口，一个满脸横肉的壮汉率领众匪列阵以待。',
    narrator: '旁白',
    content: [
      '情报没错——黑风寨的寨主果然不是泛泛之辈。',
      '那个满脸横肉的壮汉名叫"黑煞"，据说是从前朝军队中逃出来的什长。他不但自身武艺不俗，手下还训练了一批听命于他的死士。',
      '"哈哈哈！镇武城的新主人？"黑煞狂笑着，"老子在这里称王称霸的时候，你还在穿开裆裤呢！"',
      '柳一刀按住了刀柄，云娘的手已经搭上了弓弦。铁山默默地走到了队伍的最前面。',
      '陈伯的声音在你脑海中回响："寨主比普通匪徒强得多。小心他的狂暴——当他受伤严重时会变得异常凶猛。"',
      '这一战，将决定镇武城周边的命运。',
    ],
    nextChapterId: 'act2_ch3',
    trigger: { type: 'milestone', milestoneType: 'first_boss', milestoneValue: 1 },
    rewards: { iron: 200, meteorite: 10, bingxiang: 300 },
  },

  // ---- 第七章：战后余波 ----
  act2_ch3: {
    id: 'act2_ch3',
    act: 2,
    chapter: 3,
    title: '第七章',
    subtitle: '战后余波',
    scene: '黑风寨已被攻破。你在寨主的房间中发现了一张地图，上面标注着几个神秘的地点。',
    narrator: '旁白',
    content: [
      '黑煞倒下了。临死前，他发出一阵令人毛骨悚然的狂笑。',
      '"你们……你们以为黑风寨就是全部？太天真了……那张地图……去找吧……哈哈哈哈……"',
      '在他房间的暗格中，你找到了他所说的地图。',
      '上面标注着三个地方：一是城南的废弃铁矿（你们已经知道了），二是山中一处被称为"前朝密库"的隐蔽洞穴，三是地图最深处一个用红笔圈出的地点——"旧都"。',
      '而在地图的边缘，还有一行小字："武库之钥，分藏三地。"',
      '陈伯的脸色变得凝重起来："前朝武库……如果那是真的，里面藏着的兵器足以装备一支大军。"',
    ],
    choices: [
      {
        id: 'choice_act2_3_a',
        text: '先拿下铁矿，稳固资源来源',
        nextChapterId: 'act2_4_mine',
        effect: { storyFlag: 'resource_first' },
      },
      {
        id: 'choice_act2_3_b',
        text: '直接追查密库线索',
        nextChapterId: 'act2_4_secret',
        effect: { storyFlag: 'secret_first' },
      },
    ],
    nextChapterId: 'act2_4_mine',
    trigger: { type: 'auto' },
  },

  // ---- 第八章A：铁血争夺 ----
  act2_4_mine: {
    id: 'act2_4_mine',
    act: 2,
    chapter: 4,
    title: '第八章',
    subtitle: '铁血争夺',
    scene: '废弃铁矿的入口处，一队身穿锈蚀铠甲的士兵严阵以待。他们的铠甲样式……分明是前朝制式。',
    narrator: '旁白',
    content: [
      '废弃铁矿比你想象的要危险得多。',
      '占据这里的并非普通匪徒，而是一群穿着前朝制式铠甲的士兵——"披甲武卒"。他们的铠甲虽然锈迹斑斑，但防御力惊人。',
      '更糟糕的是，这支队伍的头目——"铁甲骁将"，是一个真正的高手。他不但武艺高强，而且每隔数回合就会发动一次猛击，威力惊人。',
      '"前朝的亡魂……"云娘喃喃道，"他们为什么会在这里？"',
      '没有人能回答这个问题。但有一点可以确定：要拿到这座铁矿，必须先打败他们。',
      '经过一番苦战，铁甲骁将终于倒下。他从怀中掏出一枚铜符，扔到了你面前。',
      '"这是……武库三钥之一。"陈伯捡起铜符，手微微发抖，"他们果然在守护着什么。"',
    ],
    nextChapterId: 'act2_5',
    trigger: { type: 'milestone', milestoneType: 'explore_floor', milestoneValue: 3 },
    rewards: { iron: 300, meteorite: 15, bingxiang: 200 },
  },

  // ---- 第八章B：密库探秘 ----
  act2_4_secret: {
    id: 'act2_4_secret',
    act: 2,
    chapter: 4,
    title: '第八章',
    subtitle: '密库探秘',
    scene: '隐藏在山腹深处的洞穴入口被一道石门封锁。门上刻着复杂的机关纹路。',
    narrator: '旁白',
    content: [
      '前朝密库的入口比预想中更容易找到——但进入却极其困难。',
      '洞口被一道精巧的石门封锁，上面刻满了复杂的机关纹路。柳一刀研究了半天，摇了摇头："这不是我能弄开的。需要钥匙，或者……懂机关的人。"',
      '正当你们准备离开时，一个苍老的声音从黑暗中传来：',
      '"四十年了……终于有人来了。"',
      '一个白发苍苍的老者从阴影中走出。他穿着一身褪色的儒袍，腰间挂着一个药葫芦。',
      '"老夫华佗——好吧，那是别人这么叫我的。我只是个略通医术的闲散之人。"老人微微一笑，"这座密库的机关，是我年轻时帮着设计的。如果要进去，我可以帮忙。"',
      '"但我有一个条件：让我加入你们的队伍。我想看看，这座城能不能真正复兴。"',
    ],
    nextChapterId: 'act2_5',
    trigger: { type: 'milestone', milestoneType: 'explore_floor', milestoneValue: 3 },
    rewards: { meteorite: 20, bingxiang: 200, unlockHero: 'huatuo' },
  },

  // ---- 第九章：群英荟萃 ----
  act2_5: {
    id: 'act2_5',
    act: 2,
    chapter: 5,
    title: '第九章',
    subtitle: '群英荟萃',
    scene: '镇武城的酒馆里越来越热闹。来自各地的英雄豪杰纷纷前来投奔。',
    narrator: '陈伯',
    content: [
      '将军，如今我们镇武城已是人才济济啊。',
      '那位精通医术的华佗先生已经加入了我们，有他在，将士们的伤痛再也不用担心了。还有几位新来的义士——',
      '一位姓赵名云的年轻人，白马银枪，英姿勃发。他说他是来寻找值得效忠的主公的。',
      '一位名叫林冲的汉子，使一条丈八蛇矛，据说曾在官军中做到教头。问他为何离开，他只是摇头不语。',
      '还有一位奇女子，名为穆桂英，善用飞刀，行事泼辣豪爽。她说她听说这里有"有趣的事"，就跑来看看。',
      '"有趣的事"是什么，恐怕只有她自己知道了。不过，有这样一群人在，何愁大事不成？',
    ],
    nextChapterId: 'act3_ch1',
    trigger: { type: 'milestone', milestoneType: 'hero_count', milestoneValue: 6 },
    rewards: { bingxiang: 400, food: 300, wood: 200 },
  },

  // ============================================================
  // 第三幕：迷雾深处
  // ============================================================

  // ---- 第十章：密库开启 ----
  act3_ch1: {
    id: 'act3_ch1',
    act: 3,
    chapter: 1,
    title: '第十章',
    subtitle: '密库开启',
    scene: '在华佗（或机关专家）的帮助下，石门缓缓开启。一股陈腐的气息扑面而来。',
    narrator: '旁白',
    content: [
      '随着一阵沉闷的轰鸣声，尘封数十年的石门终于开启了。',
      '手举火把走进密库，所有人都惊呆了。',
      '整整齐齐排列着的兵器架、成箱的金铁锭、还有墙壁上绘制的复杂图纸……这是一座小型的武库！',
      '"这些兵器……"赵云抽出架上一柄长枪，眼中闪光，"虽历经数十年，锋芒不减！这锻造工艺，绝非凡品！"',
      '华佗走到密库深处，从一个密封的石盒中取出一卷竹简：',
      '"这是当年负责建造这座武库的工匠留下的记录。上面写着……武库共有三把钥匙。一把在铁矿的守护者手中（我们已经拿到了），一把在旧都的前朝禁卫手中，还有一把……"',
      '他看向竹简的最后一段话。',
      '"第三把钥匙，由武库的最后一任守护者保管。而他，就在这座城市的某个地方。"',
    ],
    nextChapterId: 'act3_ch2',
    trigger: { type: 'milestone', milestoneType: 'explore_floor', milestoneValue: 5 },
    rewards: { iron: 400, meteorite: 30, bingxiang: 400 },
  },

  // ---- 第十一章：守护者 ----
  act3_ch2: {
    id: 'act3_ch2',
    act: 3,
    chapter: 2,
    title: '第十一章',
    subtitle: '守护者',
    scene: '根据竹简的指引，你在城市地下深处发现了一个隐藏的空间。一个白发苍苍的老者正在那里擦拭一柄断剑。',
    narrator: '旁白',
    content: [
      '城市地下的隐藏空间比密库更加古老。墙壁上刻满了你无法辨认的文字，地面上铺着早已腐烂的地毯。',
      '而在空间的正中央，一个白发苍苍的老者正在默默擦拭一柄断剑。',
      '"我等了很多年。"他没有抬头，"等一个有能力继承这一切的人。"',
      '"你是……武库的守护者？"',
      '"我是最后一任镇武军校尉。"老人终于抬起头来，他的眼睛里燃烧着你从未见过的光芒，"六十年前，前朝覆灭，我奉命留守此地，保护武库的秘密不被外人染指。六十年来，我看着一批又一批的人来到这里——匪徒、冒险者、寻宝者——没有一个配得上它。"',
      '"直到现在。"',
      '他将断剑连同剑鞘一起交到你手中。剑鞘上镶嵌着一枚铜符——第二把钥匙。',
      '"去吧。去旧都。完成镇武军未竟的事业。但要知道——旧都中镇守的东西，远比你想象的要可怕得多。"',
    ],
    nextChapterId: 'act3_ch3',
    trigger: { type: 'milestone', milestoneType: 'total_level', milestoneValue: 50 },
    rewards: { meteorite: 50, iron: 200, bingxiang: 500 },
  },

  // ---- 第十二章：前朝旧都 ----
  act3_ch3: {
    id: 'act3_ch3',
    act: 3,
    chapter: 3,
    title: '第十二章',
    subtitle: '旧都魅影',
    scene: '前朝旧都的废墟笼罩在永恒的暮色中。断柱之间，影影绰绰的身影在游荡。',
    narrator: '旁白',
    content: [
      '前朝旧都——这里是整个区域最危险的地方。',
      '当你踏入旧都范围的那一刻，就能感受到空气中弥漫的不祥之气。残垣断壁之间，偶尔能看到一些半透明的身影在游荡——那是死于城破之战的亡魂吗？还是别的什么东西？',
      '"小心。"穆桂英搭上了她的飞刀，"我感觉到了……这里有很多双眼睛在盯着我们。"',
      '话音未落，一群身穿前朝制式铠甲的死士从四面八方涌出。他们的动作整齐划一，明显受过严格的军事训练。',
      '"前朝死士！"赵云长枪一摆，"他们是被某种力量操控的尸体！"',
      '而在死士群的后面，一个高大威武的身影缓缓浮现——',
      '前朝武魁。旧都的终极守护者。',
    ],
    nextChapterId: 'act4_ch1',
    trigger: { type: 'milestone', milestoneType: 'explore_floor', milestoneValue: 7 },
    rewards: { iron: 500, meteorite: 50, bingxiang: 600 },
  },

  // ============================================================
  // 第四幕：决战前夕
  // ============================================================

  // ---- 第十三章：武魁之力 ----
  act4_ch1: {
    id: 'act4_ch1',
    act: 4,
    chapter: 1,
    title: '第十三章',
    subtitle: '武魁之力',
    scene: '前朝武魁站在旧都大殿的废墟之上。他的周身环绕着黑色的气息，双眼闪烁着幽蓝的光芒。',
    narrator: '旁白',
    content: [
      '"又一个挑战者。"',
      '前朝武魁的声音仿佛从四面八方同时响起。他的身体似乎由纯粹的战斗意志凝聚而成，每一块肌肉都蕴含着恐怖的力量。',
      '"你们这些外来者，永远不懂这座城市的意义。它不是一个可以被占领的据点，不是一个可以被掠夺的宝库。它是——信念的具象。"',
      '"镇武军存在的意义，不是征服，而是守护。而你们……只会破坏。"',
      '他抬手一挥，两道黑气从他掌心飞出，凝聚成两名前朝死士的形象。',
      '"让你们见识一下，真正的镇武军战力。"',
      '这场战斗，将是你面临的最大考验。武魁不但自身实力强横，还能召唤死士助战，并且他的攻击能够无视部分防御。',
      '做好准备——这是生死之战。',
    ],
    nextChapterId: 'act4_ch2',
    trigger: { type: 'milestone', milestoneType: 'boss_kill', milestoneValue: 5 },
    rewards: { meteorite: 100, iron: 800, bingxiang: 1000 },
  },

  // ---- 第十四章：真相 ----
  act4_ch2: {
    id: 'act4_ch2',
    act: 4,
    chapter: 2,
    title: '第十四章',
    subtitle: '真相',
    scene: '武魁消散之前，他的身影变得清晰起来——那是一张和你有些相似的脸。',
    narrator: '旁白',
    content: [
      '当最后一击落下时，武魁的身体开始崩解。',
      '但在完全消散之前，他的身影突然稳定了下来——你看到了他的脸。',
      '那是一张中年男子的脸，坚毅、沧桑，眼神中带着一丝……欣慰？',
      '"你……比当年的我……更强。"',
      '他的声音不再从四面八方响起，而是像一个正常人在说话。',
      '"我叫……不，这不重要。重要的是——你做到了。你证明了自己有资格继承这一切。"',
      '"武库里的东西，不是为了战争而制造的。它们是为了和平。前朝之所以覆灭，就是因为忘记了这一点。希望你……不要重蹈覆辙。"',
      '说完这句话，他的身影彻底消散了。原地只剩下一枚铜符——第三把，也是最后一把钥匙。',
    ],
    nextChapterId: 'act4_ch3',
    trigger: { type: 'auto' },
    rewards: { meteorite: 80, bingxiang: 800 },
  },

  // ---- 第十五章：武库开启 ----
  act4_ch3: {
    id: 'act4_ch3',
    act: 4,
    chapter: 3,
    title: '第十五章',
    subtitle: '武库真容',
    scene: '三把钥匙归位，武库的大门缓缓开启。里面的景象让所有人屏住了呼吸。',
    narrator: '旁白',
    content: [
      '当三把钥匙同时插入大门上的三个锁孔时，整座旧都开始震动。',
      '一面隐藏在废墟之中的巨大石墙缓缓移开，露出了后面真正的——镇武武库。',
      '那不是你之前见过的那个小型密库。那是一座宏伟的地下宫殿！',
      '成排的神兵利器闪耀着寒光，堆积如山的材料资源足够武装一支万人部队，墙壁上刻满了武功秘籍和兵法战术……',
      '"这就是……镇武军真正的遗产。"华佗惊叹道。',
      '但在武库的正中央，最引人注目的不是那些宝物，而是一块石碑。石碑上刻着寥寥数字：',
      '"以武镇世，以德服人。城之所立，民之所安。"',
      '——这才是镇武城的真正含义。',
    ],
    nextChapterId: 'act5_ch1',
    trigger: { type: 'milestone', milestoneType: 'boss_kill', milestoneValue: 10 },
    rewards: { meteorite: 200, iron: 1500, bingxiang: 2000, food: 1000, wood: 1000 },
  },

  // ============================================================
  // 第五幕：镇武新城
  // ============================================================

  // ---- 第十六章（终章）：新的开始 ----
  act5_ch1: {
    id: 'act5_ch1',
    act: 5,
    chapter: 1,
    title: '终章',
    subtitle: '镇武新城',
    scene: '一年后。镇武城已经焕然一新。城墙上旌旗飘扬，街道上车水马龙。你站在城楼上，俯瞰着这座由你亲手复兴的城市。',
    narrator: '旁白',
    content: [
      '时光荏苒，转眼间你来到镇武城已经一年有余。',
      '如今的镇武城，早已不再是当初那座破败的废墟。宽阔的街道上商铺林立，农田里麦浪翻滚，铁匠铺的锤声终日不绝于耳。城中人口从最初的一百余人发展到了数千之众。',
      '你的麾下聚集了天下英才：铁山的稳健如山、柳一刀的快剑无双、云娘的身法灵动、关胜的大刀如龙、赵云的枪出如龙、林冲的矛扫千军、穆桂英的飞刀百步穿杨、华佗的妙手回春……',
      '陈伯站在你身边，望着城中的繁华景象，脸上露出欣慰的笑容：',
      '"将军，老朽没有看错人。"',
      '你微笑着摇了摇头："不是我一个人的功劳。是所有人一起努力的结果。"',
      '远方，又有几个身影正向镇武城的方向走来。新的故事，即将开始。',
      '',
      '——【镇武孤城 · 第一部 完】——',
      '',
      '（后续内容敬请期待……）',
    ],
    nextChapterId: 'ending',
    trigger: { type: 'milestone', milestoneType: 'hero_count', milestoneValue: 13 },
    rewards: { meteorite: 500, iron: 3000, bingxiang: 5000, food: 2000, wood: 2000, population: 200 },
  },

  // ---- 结局 ----
  ending: {
    id: 'ending',
    act: 5,
    chapter: 99,
    title: '结局',
    subtitle: '功成名就',
    scene: '镇武城在你的治理下成为了方圆百里最繁华的城市。你的名字将被载入史册。',
    narrator: '史官',
    content: [
      '《镇武志·城主本纪》：',
      '',
      '永安四年，有城主至镇武废墟，抚慰流民，修缮城郭，招贤纳士。',
      '越明年，平黑风寨，复铁矿，启前朝密库，入旧都败武魁，开武库得先贤遗珍。',
      '由是镇武复兴，商贾云集，万民乐业。四方豪杰闻风来附，城中英才济济，咸谓之一代明主。',
      '',
      '赞曰：孤城不孤，因有人兴。废墟不废，因有心建。武德昭昭，镇守一方。此镇武之城主也。',
      '',
      '—— 全剧终 ——',
      '',
      '感谢您游玩《镇武孤城》！',
      '故事虽然暂时告一段落，但您的征程仍在继续——',
      '继续探索、继续战斗、继续建设属于您的镇武城吧！',
    ],
    trigger: { type: 'manual' },
    rewards: { meteorite: 999, iron: 9999, bingxiang: 9999 },
  },
};

/** 按幕分组 */
export const ACTS = [
  { id: 1, name: '第一幕：孤城初现', chapters: ['prologue', 'act1_ch1', 'act1_ch2_cautious', 'act1_ch2_bold', 'act1_ch3', 'act1_ch4'] },
  { id: 2, name: '第二幕：群雄汇聚', chapters: ['act2_ch1', 'act2_ch2', 'act2_ch3', 'act2_4_mine', 'act2_4_secret', 'act2_5'] },
  { id: 3, name: '第三幕：迷雾深处', chapters: ['act3_ch1', 'act3_ch2', 'act3_ch3'] },
  { id: 4, name: '第四幕：决战前夕', chapters: ['act4_ch1', 'act4_ch2', 'act4_ch3'] },
  { id: 5, name: '第五幕：镇武新城', chapters: ['act5_ch1', 'ending'] },
];

/** 获取章节 */
export function getChapter(id: string): StoryChapter | undefined {
  return STORY_CHAPTERS[id];
}

/** 获取某一幕的所有章节 */
export function getActChapters(actId: number): StoryChapter[] {
  const act = ACTS.find(a => a.id === actId);
  if (!act) return [];
  return act.chapters.map(id => STORY_CHAPTERS[id]).filter(Boolean) as StoryChapter[];
}

/** 获取下一个可解锁的章节ID */
export function getNextChapter(currentId: string, state: StoryState): string | null {
  const current = STORY_CHAPTERS[currentId];
  if (!current) return null;

  // 检查是否有玩家选择覆盖的路径
  const chosenPath = state.readChoices[`${currentId}_choice`];
  if (chosenPath) {
    const choice = current.choices?.find(c => c.id === chosenPath);
    if (choice) return choice.nextChapterId;
  }

  return current.nextChapterId || null;
}

/** 初始化剧情状态 */
export function createInitialStoryState(): StoryState {
  return {
    currentChapterId: 'prologue',
    completedChapterIds: [],
    unlockedChapterIds: ['prologue'],
    storyFlags: {},
    readChoices: {},
    lastReadTime: 0,
  };
}
