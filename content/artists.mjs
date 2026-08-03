export const artistLocales = ['ru', 'en', 'ja'];

export const artistPageUi = {
  ru: {
    langName: 'Русский',
    skip: 'Перейти к содержанию',
    catalogEyebrow: 'Tarski · Сеть',
    catalogTitle: 'Художники',
    catalogLead: 'Сеть художников-единомышленников Tarski.',
    catalogDescription: 'Художники и художественные коллективы сети Tarski.',
    profileEyebrow: 'Tarski · Художники',
    profileBack: 'Все художники',
    homeBack: 'На главную',
    openProfile: 'Открыть страницу',
    galleryTitle: 'Работы и документация',
    linksLabel: 'Ссылки',
    siteLabel: 'Сайт',
    instagramLabel: 'Инстаграм',
    languageLabel: 'Выбор языка'
  },
  en: {
    langName: 'English',
    skip: 'Skip to content',
    catalogEyebrow: 'Tarski · Network',
    catalogTitle: 'Artists',
    catalogLead: 'Tarski’s network of like-minded artists.',
    catalogDescription: 'Artists and artistic collectives in the Tarski network.',
    profileEyebrow: 'Tarski · Artists',
    profileBack: 'All artists',
    homeBack: 'Home',
    openProfile: 'Open profile',
    galleryTitle: 'Works and documentation',
    linksLabel: 'Links',
    siteLabel: 'Website',
    instagramLabel: 'Instagram',
    languageLabel: 'Language'
  },
  ja: {
    langName: '日本語',
    skip: '本文へ移動',
    catalogEyebrow: 'Tarski · ネットワーク',
    catalogTitle: 'アーティスト',
    catalogLead: 'Tarskiの志を共有するアーティストたちのネットワーク。',
    catalogDescription: 'Tarskiのネットワークに参加するアーティストとアーティスト・コレクティブ。',
    profileEyebrow: 'Tarski · アーティスト',
    profileBack: 'アーティスト一覧',
    homeBack: 'トップへ',
    openProfile: 'プロフィールを開く',
    galleryTitle: '作品と記録',
    linksLabel: 'リンク',
    siteLabel: 'ウェブサイト',
    instagramLabel: 'Instagram',
    languageLabel: '言語'
  }
};

export const artists = [
  {
    key: 'anastasia',
    slug: 'anastasia-dahl',
    domId: 'artist-anastasia-dahl',
    image: {
      card: 'assets/artist-cover.png',
      dossier: 'assets/artist-index/330551584_215344677620530_5433914055885423503_n.jpg',
      width: 628,
      height: 850
    },
    preview: {
      src: 'assets/artist-index/330551584_215344677620530_5433914055885423503_n.jpg',
      fit: 'cover',
      ratio: '1',
      width: 'min(36vw, 560px)',
      washLight: 'rgba(176, 170, 154, 0.42)',
      washDark: 'rgba(176, 170, 154, 0.18)'
    },
    links: {
      site: 'https://anastasiadahl.wordpress.com/',
      instagram: 'https://www.instagram.com/anastasia_dahl/'
    },
    locales: {
      ru: {
        name: 'Анастасия Даль',
        role: 'Художница танца и перформанса',
        roleHtml: 'Художница танца и&nbsp;перформанса',
        bio: 'Занимается танц-перформансом и, помимо работ в этом медиуме, исследует, как особая тонкость внимания, которую тренирует практика танц-импровизации, может проявляться в других контекстах. Ей близки социология и культурная антропология. Также ведёт арт-медиации в художественных галереях и курирует сообщество междисциплинарных художников в Бристоле.',
        bioHtml: 'Занимается танц-перформансом и,&nbsp;помимо работ в&nbsp;этом медиуме, исследует, как особая тонкость внимания, которую тренирует практика танц-импровизации, может проявляться в&nbsp;других контекстах. Ей&nbsp;близки социология и&nbsp;культурная антропология. Также ведёт арт-медиации в&nbsp;художественных галереях и&nbsp;курирует сообщество междисциплинарных художников в&nbsp;Бристоле.'
      },
      en: {
        name: 'Anastasia Dahl',
        role: 'Dance and performance artist',
        bio: 'She works with dance performance and, beyond this medium, is interested in how the particular subtlety of attention trained through dance improvisation can manifest itself in other contexts. She is close to sociology and cultural anthropology. She also leads art mediations in art galleries and curates a community of interdisciplinary artists in Bristol.'
      },
      ja: {
        name: 'アナスタシア・ダール',
        role: 'ダンス／パフォーマンス・アーティスト',
        bio: 'ダンス・パフォーマンスに取り組んでいます。また、このメディウムでの作品制作に加えて、ダンス・インプロヴィゼーションの実践によって養われる繊細な注意のあり方が、他の文脈においてどのように現れるのかに関心を寄せています。社会学や文化人類学とも近い関係にあります。アートギャラリーでのアート・メディエーションを行うほか、ブリストルで学際的なアーティストのコミュニティをキュレーションしています。'
      }
    },
    gallery: {
      layout: 'editorial',
      responsiveMedia: 'avif',
      images: [
        {
          src: 'assets/artist-index/anastasia-dahl/ad-co-incidence.jpg',
          width: 1800,
          height: 1200,
          variant: 'opener',
          label: { ru: 'Co-incidence', en: 'Co-incidence', ja: 'Co-incidence' },
          alt: {
            ru: 'Анастасия Даль в движении',
            en: 'Anastasia Dahl in motion',
            ja: '動きの中のアナスタシア・ダール'
          }
        },
        {
          src: 'assets/artist-index/anastasia-dahl/ad-1.jpg',
          width: 1200,
          height: 1800,
          variant: 'portrait',
          alt: {
            ru: 'Групповая перформативная композиция с Анастасией Даль',
            en: 'Group performance composition with Anastasia Dahl',
            ja: 'アナスタシア・ダールを含むグループ・パフォーマンス'
          }
        },
        {
          src: 'assets/artist-index/anastasia-dahl/ad-copypaste.jpg',
          width: 1800,
          height: 1199,
          variant: 'wide',
          label: { ru: 'CopyPaste', en: 'CopyPaste', ja: 'CopyPaste' },
          alt: {
            ru: 'Перформанс Анастасии Даль на сцене',
            en: 'Anastasia Dahl performing on stage',
            ja: '舞台上でパフォーマンスをするアナスタシア・ダール'
          }
        },
        {
          src: 'assets/artist-index/anastasia-dahl/ad-moving-moss.jpg',
          width: 1800,
          height: 1204,
          variant: 'wide',
          label: { ru: 'Moving Moss', en: 'Moving Moss', ja: 'Moving Moss' },
          alt: {
            ru: 'Ночная документация перформанса Анастасии Даль',
            en: 'Night-time documentation of an Anastasia Dahl performance',
            ja: 'アナスタシア・ダールのパフォーマンスの夜間記録'
          }
        },
        {
          src: 'assets/artist-index/anastasia-dahl/ad-spirare-1.jpg',
          width: 1200,
          height: 784,
          variant: 'pair',
          label: { ru: 'Spirare', en: 'Spirare', ja: 'Spirare' },
          alt: {
            ru: 'Документация перформанса Анастасии Даль',
            en: 'Documentation of an Anastasia Dahl performance',
            ja: 'アナスタシア・ダールのパフォーマンス記録'
          }
        },
        {
          src: 'assets/artist-index/anastasia-dahl/ad-spirare-2.jpg',
          width: 915,
          height: 1400,
          variant: 'pair',
          alt: {
            ru: 'Анастасия Даль во время перформанса',
            en: 'Anastasia Dahl during a performance',
            ja: 'パフォーマンス中のアナスタシア・ダール'
          }
        },
        {
          src: 'assets/artist-index/anastasia-dahl/ad-spirare-3.jpg',
          width: 1400,
          height: 933,
          variant: 'wide',
          alt: {
            ru: 'Групповая практика с участием Анастасии Даль',
            en: 'Group practice with Anastasia Dahl',
            ja: 'アナスタシア・ダールが参加するグループ実践'
          }
        }
      ]
    }
  },
  {
    key: 'irhs',
    slug: 'idas',
    domId: 'artist-irhs',
    image: {
      card: 'assets/irhs.png',
      dossier: 'assets/irhs.png',
      width: 314,
      height: 425
    },
    preview: {
      src: 'assets/irhs.png',
      fit: 'contain',
      ratio: '0.72',
      width: 'min(36vw, 470px)',
      washLight: 'rgba(232, 232, 224, 0.44)',
      washDark: 'rgba(232, 232, 224, 0.16)'
    },
    links: {
      site: 'https://irhs.art/',
      instagram: 'https://www.instagram.com/institute_situations'
    },
    locales: {
      ru: {
        name: 'Институт развития художественных ситуаций (ИРХС)',
        nameHtml: 'Институт развития художе&shy;ственных ситуаций (ИРХС)',
        index: 'ИРХС',
        role: 'Самопровозглашенный независимый институт, занимающийся хранением, анализом и поддержкой художественных ситуаций',
        roleHtml: 'Самопровоз&shy;глашенный независимый институт, занимающийся хранением, анализом и&nbsp;поддержкой художественных ситуаций',
        bio: 'В фокусе внимания ИРХС находятся партиципаторные, процессуальные и парафикциональные практики современного искусства России и мира. Под художественной ситуацией в целом мы понимаем форму общественных взаимодействий, инициированную художником или группой художников и выступающую альтернативой устоявшимся формам коммуникации.',
        bioHtml: 'В&nbsp;фокусе внимания ИРХС находятся партиципаторные, процессуаль&shy;ные и&nbsp;парафикциональные практики современного искусства России и&nbsp;мира. Под художественной ситуацией в&nbsp;целом мы&nbsp;понимаем форму общественных взаимодействий, инициированную художником или группой художников и&nbsp;выступающую альтерна&shy;тивой устоявшимся формам коммуникации.'
      },
      en: {
        name: 'Institute for the Development of Artistic Situations /IDAS/',
        index: 'IDAS',
        role: 'A self-proclaimed independent institute dedicated to the preservation, analysis, and support of artistic situations',
        bio: 'IDAS focuses on participatory, process-based, and parafictional practices in contemporary art in Russia and internationally. By an artistic situation, we broadly understand a form of social interaction initiated by an artist or a group of artists, which serves as an alternative to established forms of communication.'
      },
      ja: {
        name: '芸術的状況発展研究所／IDAS',
        index: 'IDAS',
        role: '芸術的状況の保存、分析、支援に取り組む、自称・独立機関',
        bio: 'IDASは、ロシアおよび国際的な現代アートにおける、参加型、プロセス型、パラフィクショナルな実践に焦点を当てています。私たちは「芸術的状況」を、アーティストまたはアーティストのグループによって始められる社会的相互作用の形式として広く捉えています。それは、既存のコミュニケーションの形式に対するオルタナティブとして機能するものです。'
      }
    }
  },
  {
    key: 'nadezhda',
    slug: 'nadezhda-ishkinyaeva',
    domId: 'artist-nadezhda-ishkinyaeva',
    image: {
      card: 'assets/ish_nadya.png',
      dossier: 'assets/artist-index/nadezhda-ishkinyaeva.jpg',
      width: 314,
      height: 425
    },
    preview: {
      src: 'assets/artist-index/nadezhda-ishkinyaeva.jpg',
      fit: 'cover',
      ratio: '0.711',
      width: 'min(30vw, 430px)',
      washLight: 'rgba(206, 197, 183, 0.4)',
      washDark: 'rgba(206, 197, 183, 0.16)'
    },
    links: {
      instagram: 'https://www.instagram.com/ish_nadya/'
    },
    locales: {
      ru: {
        name: 'Надежда Ишкиняева',
        role: 'Художница и исследовательница, работает на стыке визуального искусства и инклюзии',
        roleHtml: 'Художница и&nbsp;исследовательница, работает на&nbsp;стыке визуального искусства и&nbsp;инклюзии',
        bio: 'В своих проектах она использует междисциплинарный подход, соединяя академическое образование с практиками заботы о художниках и художницах, проживающих в психоневрологических интернатах. Работы Надежды строятся вокруг двух направлений: наблюдение за действительностью, которое она фиксирует через письмо и пленэр, и создание образовательных программ для горожан.',
        bioHtml: 'В&nbsp;своих проектах она использует междисциплинарный подход, соединяя академическое образование с&nbsp;практиками заботы о&nbsp;художниках и&nbsp;художницах, проживающих в&nbsp;психоневрологических интернатах. Работы Надежды строятся вокруг двух направлений: наблюдение за&nbsp;действительностью, которое она фиксирует через письмо и&nbsp;пленэр, и&nbsp;создание образовательных программ для горожан.'
      },
      en: {
        name: 'Nadezhda Ishkinyaeva',
        role: 'Artist and researcher working at the intersection of visual art and inclusion',
        bio: 'In her projects, she uses an interdisciplinary approach, combining academic education with practices of care for artists living in psychoneurological residential institutions. Nadezhda’s work is built around two directions: observing reality, which she records through writing and plein-air practice, and creating educational programmes for city residents.'
      },
      ja: {
        name: 'ナジェージダ・イシュキニャエワ',
        role: 'ビジュアルアートとインクルージョンの交差点で活動するアーティスト／研究者',
        bio: '彼女のプロジェクトでは、学術的な教育と、精神神経系の入所型福祉施設で暮らすアーティストたちへのケアの実践を結びつける、学際的なアプローチが用いられています。ナジェージダの活動は、二つの方向性を中心に展開されています。一つは、現実を観察し、それを文章やプレネールの実践を通じて記録すること。もう一つは、市民のための教育プログラムをつくることです。'
      }
    }
  },
  {
    key: 'elena',
    slug: 'elena-kolesnikova',
    domId: 'artist-elena-kolesnikova',
    image: {
      card: 'assets/kolesnikova.png',
      dossier: 'assets/artist-index/Елена Колесникова.webp',
      width: 314,
      height: 425
    },
    preview: {
      src: 'assets/artist-index/Елена Колесникова.webp',
      fit: 'cover',
      ratio: '0.667',
      width: 'min(30vw, 430px)',
      washLight: 'rgba(205, 207, 199, 0.42)',
      washDark: 'rgba(205, 207, 199, 0.16)'
    },
    locales: {
      ru: {
        name: 'Елена Колесникова',
        role: 'Художница, архитектор, куратор домашней резиденции',
        bio: 'Занимается исследованием жилых пространств и архитектуры как среды в социальном аспекте. Работает с местным художественным сообществом как куратор, в котором совместно создают горизонтальные связи и работают с интересным им контекстом. Как художница создает социальные скульптуры, инсталляции и графику.',
        bioHtml: 'Занимается исследованием жилых пространств и&nbsp;архитектуры как&nbsp;среды в&nbsp;социальном аспекте. Работает с&nbsp;местным художественным сообществом как&nbsp;куратор, в&nbsp;котором совместно создают горизонтальные связи и&nbsp;работают с&nbsp;интересным им&nbsp;контекстом. Как художница создает социальные скульптуры, инсталляции и&nbsp;графику.'
      },
      en: {
        name: 'Elena Kolesnikova',
        role: 'Artist, architect, curator of a home residency',
        bio: 'She researches residential spaces and architecture as socially embedded environments. As a curator, she works with the local artistic community, collectively creating horizontal connections and engaging with contexts that are meaningful to them. As an artist, she creates social sculptures, installations, and graphic works.'
      },
      ja: {
        name: 'エレーナ・コレスニコワ',
        role: 'アーティスト、建築家、ホーム・レジデンスのキュレーター',
        bio: '居住空間と建築を、社会的な環境として研究しています。キュレーターとしては、地域のアート・コミュニティと協働し、水平的なつながりを共につくりながら、自分たちにとって意味のある文脈に取り組んでいます。アーティストとしては、ソーシャル・スカルプチャー、インスタレーション、グラフィック作品を制作しています。'
      }
    }
  },
  {
    key: 'alina',
    slug: 'alina-kugush',
    domId: 'artist-alina-kugush',
    image: {
      card: 'assets/kugush.png',
      dossier: 'assets/artist-index/izobrazhenie-dsc05043-1-1500x.jpg',
      width: 314,
      height: 425
    },
    preview: {
      src: 'assets/artist-index/izobrazhenie-dsc05043-1-1500x.jpg',
      fit: 'cover',
      ratio: '0.75',
      width: 'min(32vw, 460px)',
      washLight: 'rgba(205, 184, 158, 0.4)',
      washDark: 'rgba(205, 184, 158, 0.16)'
    },
    links: {
      site: 'https://kugush.com/',
      instagram: 'https://www.instagram.com/kugush_artist/'
    },
    locales: {
      ru: {
        name: 'Алина Кугуш',
        role: 'Художница',
        bio: 'Художественная практика построена вокруг манифестации неуместности, плутовства и обретения силы у заведомо бессильных.',
        bioHtml: 'Художественная практика построена вокруг манифестации неуместности, плутовства и&nbsp;обретения силы у&nbsp;заведомо бессильных.'
      },
      en: {
        name: 'Alina Kugush',
        role: 'Artist',
        bio: 'Her artistic practice is built around the manifestation of inappropriateness, tricksterism, and the acquisition of strength by those who are inherently powerless.'
      },
      ja: {
        name: 'アリーナ・クグシュ',
        role: 'アーティスト',
        bio: '彼女の芸術実践は、不適切さの表明、トリックスター性、そしてあらかじめ力を持たないとされる者たちが力を獲得していくことをめぐって構成されています。'
      }
    },
    gallery: {
      layout: 'essay',
      responsiveMedia: 'avif',
      credit: {
        ru: 'Фото: Полина Рукавичкина, Пространство А',
        en: 'Photo: Polina Rukavichkina, Space A',
        ja: '写真：ポリーナ・ルカヴィチキナ、スペースA'
      },
      images: [
        {
          src: 'assets/artist-index/alina-kugush/dsc04683.jpg',
          width: 1500,
          height: 2000,
          alt: {
            ru: 'Алина Кугуш в сценическом образе на фоне живописной работы с замком и собакой',
            en: 'Alina Kugush in costume in front of a painting of a castle and a dog',
            ja: '城と犬を描いた絵画の前で舞台衣装を着るアリーナ・クグシュ'
          },
          caption: {
            ru: 'Документация действия',
            en: 'Action documentation',
            ja: 'アクションの記録'
          }
        },
        {
          src: 'assets/artist-index/alina-kugush/dsc05244.jpg',
          width: 1500,
          height: 2000,
          alt: {
            ru: 'Алина Кугуш разворачивает большую живописную работу во время перформанса',
            en: 'Alina Kugush unfolds a large painting during a performance',
            ja: 'パフォーマンス中に大きな絵画作品を広げるアリーナ・クグシュ'
          },
          caption: {
            ru: 'Фрагмент перформанса',
            en: 'Performance fragment',
            ja: 'パフォーマンスの断片'
          }
        },
        {
          src: 'assets/artist-index/alina-kugush/kuguu.jpg',
          width: 1500,
          height: 985,
          wide: true,
          alt: {
            ru: 'Домик, собранный из моментальных фотографий, в двух ракурсах',
            en: 'A house-shaped object made from instant photographs, shown from two angles',
            ja: 'インスタント写真で組み立てた家型のオブジェを二方向から見たもの'
          },
          caption: {
            ru: 'Живописная работа в пространстве',
            en: 'Painting in space',
            ja: '空間の中の絵画作品'
          }
        },
        {
          src: 'assets/artist-index/alina-kugush/lg-ff.jpg',
          width: 1500,
          height: 988,
          wide: true,
          alt: {
            ru: 'Два эпизода перформанса Алины Кугуш перед живописными работами',
            en: 'Two moments from Alina Kugush’s performance in front of paintings',
            ja: '絵画作品の前で行われたアリーナ・クグシュのパフォーマンスの二場面'
          },
          caption: {
            ru: 'Перформативный объект',
            en: 'Performative object',
            ja: 'パフォーマティブなオブジェクト'
          }
        },
        {
          src: 'assets/artist-index/alina-kugush/alina.jpg',
          width: 1500,
          height: 967,
          wide: true,
          alt: {
            ru: 'Два эпизода перформанса Алины Кугуш на фоне текстовой инсталляции',
            en: 'Two moments from Alina Kugush’s performance in front of a text installation',
            ja: '文字によるインスタレーションの前で行われたアリーナ・クグシュのパフォーマンスの二場面'
          },
          caption: {
            ru: 'Экспозиционный вид',
            en: 'Installation view',
            ja: '展示風景'
          }
        },
        {
          src: 'assets/artist-index/alina-kugush/kugushh.jpg',
          width: 1500,
          height: 928,
          wide: true,
          alt: {
            ru: 'Алина Кугуш показывает большую живописную работу во время перформанса',
            en: 'Alina Kugush presents a large painting during a performance',
            ja: 'パフォーマンス中に大きな絵画作品を掲げるアリーナ・クグシュ'
          },
          caption: {
            ru: 'Работа в пространстве',
            en: 'Work in space',
            ja: '空間内の作品'
          }
        },
        {
          src: 'assets/artist-index/alina-kugush/dsc05080.jpg',
          width: 1500,
          height: 2000,
          alt: {
            ru: 'Алина Кугуш стоит на руках рядом с живописной работой',
            en: 'Alina Kugush performs a handstand beside a painting',
            ja: '絵画作品のそばで逆立ちするアリーナ・クグシュ'
          },
          caption: {
            ru: 'Документация действия',
            en: 'Action documentation',
            ja: 'アクションの記録'
          }
        }
      ]
    }
  },
  {
    key: 'noExcuse',
    slug: 'no-excuses',
    domId: 'artist-no-excuse-group',
    image: {
      card: 'assets/noexcusegroup.png',
      dossier: 'assets/artist-index/0015.jpg.webp',
      width: 314,
      height: 425
    },
    preview: {
      src: 'assets/artist-index/0015.jpg.webp',
      fit: 'cover',
      ratio: '1.5',
      width: 'min(56vw, 760px)',
      washLight: 'rgba(118, 126, 118, 0.34)',
      washDark: 'rgba(118, 126, 118, 0.16)'
    },
    links: {
      site: 'https://noexcusegroup.tilda.ws/',
      instagram: 'https://www.instagram.com/no_excuse_group/'
    },
    locales: {
      ru: {
        name: 'Никаких оправданий',
        role: 'Сплоченная команда профессионалов и художественный коллектив',
        roleHtml: 'Сплоченная команда профессионалов и&nbsp;художественный коллектив',
        bio: 'Наслаждаются жизнью и искусством, практикуют насыщенный досуг, радость коллективности, партисипаторные практики, садоводство и приготовление блюд из картофеля.',
        bioHtml: 'Наслаждаются жизнью и&nbsp;искусством, практикуют насыщенный досуг, радость коллективности, партисипаторные практики, садоводство и&nbsp;приготовление блюд из&nbsp;картофеля.'
      },
      en: {
        name: 'No Excuses',
        index: 'No Excuses',
        role: 'A close-knit team of professionals and an artistic collective',
        bio: 'They enjoy life and art, and practise rich leisure, the joy of collectivity, participatory practices, gardening, and cooking dishes made from potatoes.'
      },
      ja: {
        name: 'アーティスティック・コレクティブ「No Excuses」',
        index: 'No Excuses',
        role: '専門家による結束したチームであり、アーティスト・コレクティブ',
        bio: '生活とアートを楽しみ、豊かな余暇、集団性の喜び、参加型の実践、ガーデニング、そしてジャガイモ料理づくりを実践しています。'
      }
    }
  },
  {
    key: 'daria',
    slug: 'daria-orlova',
    domId: 'artist-daria-orlova',
    image: {
      card: 'assets/orlova.png',
      dossier: 'assets/orlova.png',
      width: 314,
      height: 425
    },
    preview: {
      src: 'assets/orlova.png',
      fit: 'contain',
      ratio: '0.72',
      width: 'min(36vw, 470px)',
      washLight: 'rgba(202, 202, 196, 0.4)',
      washDark: 'rgba(202, 202, 196, 0.16)'
    },
    links: {
      instagram: 'https://www.instagram.com/darian_orlova'
    },
    locales: {
      ru: {
        name: 'Дарья Орлова',
        role: 'Трансдисциплинарная художница, перформерка, кураторка. Работает со звуком, практиками внимательного слушания',
        roleHtml: 'Трансдисциплинарная художница, перформерка, кураторка. Работает со&nbsp;звуком, практиками внимательного слушания',
        bio: 'Художественная, исследовательская и педагогическая деятельность направлена на пересборку и со-настройку культурных сообществ и микро-групп Санкт-Петербурга через организацию звуковых событий — концерты, перформансы, воркшопы, лекции, прогулки. Эти практики помогают создать более инклюзивное аудиальное пространство, которое укрепляет доверие и развивает чувство сопричастности.',
        bioHtml: 'Художественная, исследовательская и&nbsp;педагогическая деятельность направлена на&nbsp;пересборку и&nbsp;со-настройку культурных сообществ и&nbsp;микро-групп Санкт-Петербурга через организацию звуковых событий&nbsp;&mdash; концерты, перформансы, воркшопы, лекции, прогулки. Эти практики помогают создать более инклюзивное аудиальное пространство, которое укрепляет доверие и&nbsp;развивает чувство сопричастности.'
      },
      en: {
        name: 'Daria Orlova',
        role: 'Transdisciplinary artist, performer, and curator. Works with sound and practices of attentive listening',
        bio: 'Her artistic, research, and pedagogical work is aimed at reassembling and co-tuning cultural communities and micro-groups in Saint Petersburg through the organisation of sound events — concerts, performances, workshops, lectures, and walks. These practices help create a more inclusive auditory space, strengthening trust and developing a sense of belonging.'
      },
      ja: {
        name: 'ダリア・オルロワ',
        role: 'トランスディシプリナリー・アーティスト、パフォーマー、キュレーター。音と、注意深く聴く実践に取り組む',
        bio: '彼女の芸術、研究、教育に関わる活動は、サンクトペテルブルクの文化的コミュニティやマイクロ・グループを再構成し、共に調律していくことを目指しています。そのために、コンサート、パフォーマンス、ワークショップ、レクチャー、散歩といった音の出来事を企画しています。これらの実践は、よりインクルーシブな聴覚的空間をつくり、信頼を強め、帰属感を育てることに寄与しています。'
      }
    }
  }
];
