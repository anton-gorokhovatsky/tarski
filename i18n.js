(() => {
  const storageKey = 'tarski-language';
  const supportedLanguages = ['ru', 'en', 'ja'];
  const artistKeys = {
    'artist-anastasia-dahl': 'anastasia',
    'artist-irhs': 'irhs',
    'artist-nadezhda-ishkinyaeva': 'nadezhda',
    'artist-elena-kolesnikova': 'elena',
    'artist-alina-kugush': 'alina',
    'artist-no-excuse-group': 'noExcuse',
    'artist-daria-orlova': 'daria'
  };

  const translations = {
    ru: {
      htmlLang: 'ru',
      meta: {
        title: 'Tarski — социально ориентированное искусство',
        description: 'Среда изучения и поддержки социально ориентированного и вовлекающего искусства.',
        locale: 'ru_RU'
      },
      ui: {
        skip: 'Перейти к содержанию',
        header: 'Шапка сайта',
        mainNav: 'Основная навигация',
        mobileNav: 'Закреплённая мобильная навигация',
        mobilePanel: 'Разделы страницы',
        language: 'Выбор языка',
        languageNames: {
          ru: 'Русский',
          en: 'Английский',
          ja: 'Японский'
        },
        nav: {
          about: 'О проекте',
          patrons: 'Клуб патронов',
          artists: 'Художники',
          mail: 'Написать нам'
        },
        scenes: {
          cover: 'Меню',
          about: 'Среда',
          patrons: 'Участие',
          artists: 'Сеть'
        },
        themeDark: 'Включить темную тему',
        themeLight: 'Включить светлую тему',
        serviceOpen: 'Открыть настройки сайта',
        serviceClose: 'Закрыть настройки сайта',
        openDetails: 'Открыть подробности: ',
        closeDetails: 'Закрыть подробности',
        links: {
          site: 'Сайт',
          instagram: 'Инстаграм'
        },
        footerLegal: 'Решением суда запрещена «деятельность компании Meta Platforms Inc. по реализации продуктов — социальных сетей Facebook и Instagram на территории Российской Федерации по основаниям осуществления экстремистской деятельности»'
      }
    },
    en: {
      htmlLang: 'en',
      meta: {
        title: 'Tarski — Participatory and Socially Engaged Art',
        description: 'Researching and supporting participatory and socially engaged art.',
        locale: 'en_US'
      },
      ui: {
        skip: 'Skip to content',
        header: 'Site header',
        mainNav: 'Main navigation',
        mobileNav: 'Fixed mobile navigation',
        mobilePanel: 'Page sections',
        language: 'Language',
        languageNames: {
          ru: 'Russian',
          en: 'English',
          ja: 'Japanese'
        },
        nav: {
          about: 'About',
          patrons: 'Patrons’ Club',
          artists: 'Artists',
          mail: 'Contact us'
        },
        scenes: {
          cover: 'Menu',
          about: 'Environment',
          patrons: 'Participation',
          artists: 'Network'
        },
        themeDark: 'Switch to dark theme',
        themeLight: 'Switch to light theme',
        serviceOpen: 'Open site settings',
        serviceClose: 'Close site settings',
        openDetails: 'Open details: ',
        closeDetails: 'Close details',
        links: {
          site: 'Website',
          instagram: 'Instagram'
        },
        footerLegal: 'By court decision, the activities of Meta Platforms Inc. related to the Facebook and Instagram social networks are prohibited in the Russian Federation on grounds of extremist activity.'
      },
      superlead: 'Researching and Supporting Participatory and Socially Engaged Art',
      about: {
        label: 'environment',
        title: 'About',
        lead: 'We create an environment for the development of participatory and socially engaged art through working with artists, educational formats, and cultural initiatives.',
        practice: {
          marker: 'field of practices',
          title: 'What Kind of Art We Work With',
          intro: 'The project focuses on artistic practices that artists themselves may define in different ways, but which relate to a shared field of terms:',
          terms: [
            'participatory art',
            'art of participation',
            'socially engaged art',
            'dialogical art',
            'collaborative practices',
            'interaction-based practices',
            'and others'
          ],
          summary: 'Context of practices',
          context: [
            'Such artistic practices are often referred to as “participatory” — art based on collective action, in which participants are involved in the process of creating the work and become its co-authors. This kind of art creates a social space where people come together and form new communities based on solidarity and empathy.',
            'Because of this quality, many of these practices unfold within a social context — through working with people, environments, and forms of coexistence.',
            'This approach to art-making is distinguished by a heightened attention to process as a product: what matters is not only the form and the final outcome, but also ethical questions, the sustainability of relationships, and the development of connections that emerge during the process and continue beyond it.'
          ]
        },
        focus: {
          marker: 'focus',
          title: 'Approach and Themes',
          paragraphs: [
            'We work with artistic practices at the intersection of contemporary art, participation, and philanthropy, addressing themes that influence the quality of life of individuals in society: social connectedness, access and inclusion, education and knowledge exchange, ecological and cultural sustainability.',
            'We are interested in forms of interaction based on respect, care, and responsibility.',
            'We also work with practices connected to ecological and cultural sustainability, and with the ways in which forms of interaction are built.',
            'We see art as a space of participation, dialogue, and shared experience, where people can be not only viewers, but also co-participants in what is taking place.'
          ]
        },
        mediator: {
          marker: 'mediation',
          title: 'Tarski as a Mediating Project',
          intro: [
            'As experts in contemporary art, the art market, and philanthropy, we know how to reveal the value of complex and process-based practices.',
            'Our task is to create an environment in which such art can exist in different forms — from an object to an event — and find its audience and collector.'
          ],
          headings: [
            'Research and Archiving',
            'Developing Collectible Forms',
            'Visibility'
          ],
          paragraphs: [
            'We document and describe practices through texts and readers, shaping a language that makes it possible to speak about them. In parallel, we develop a media presence through interviews with artists, curators, and participants, as well as publications that reveal the context of their work.',
            'We work with artistic practices that are more difficult to sustain within market logic and create conditions for their collectability: objects, documentation, forms of participation, special editions, and other formats.',
            'We build a public field around socially oriented art, making it understandable and visible beyond the professional circle. We introduce audiences to these practices through the foundation’s public programme, gradually forming a sustainable community of solidarity around them.'
          ],
          conclusion: 'In this way, Tarski acts as a guide for this art — connecting artistic practices, the professional field, and a broader cultural context.'
        },
        structure: {
          marker: 'structure',
          title: 'What Tarski Consists Of',
          items: [
            ['Advisory Board', 'Professionals from the fields of culture, education, business, and media who support the development of Tarski through their expertise, networks, and reputation.'],
            ['Work With Artists', 'Support for artistic projects, research, residencies, and new forms of participatory art.'],
            ['Patrons’ Club', 'A community that supports Tarski financially and participates in the development of the foundation.'],
            ['Public Programmes', 'Participation in conferences, festivals, discussions, educational and cultural projects organised by partner cultural institutions.'],
            ['Partnerships', 'Collaboration with cultural institutions, universities, foundations, businesses, media, and private initiatives.']
          ]
        }
      },
      patrons: {
        label: 'participation',
        title: 'Tarski Foundation Patrons’ Club',
        lead: 'A programme for participating in contemporary art through experience, interaction, and direct contact with artists and the professional community.',
        marker: 'club',
        programmeTitle: 'Regular Programme',
        items: [
          ['Visits to Artists’ Studios', 'You meet artists and support their projects, giving them the opportunity to work with new ideas and formats.'],
          ['Meetings and Closed Events With Authors', 'You meet artists and support their projects, giving them the opportunity to work with new ideas and formats.'],
          ['Lectures, Mediations, and Educational Formats', 'You meet artists and support their projects, giving them the opportunity to work with new ideas and formats.'],
          ['Special Projects and Collaborations With Cultural Institutions', 'You meet artists and support their projects, giving them the opportunity to work with new ideas and formats.']
        ],
        final: 'The formats are designed so that participants can not only observe, but also understand artistic practices and the process of creating works of art more deeply.'
      },
      artists: {
        label: 'network',
        title: 'A Network of Like-Minded Artists',
        items: {
          anastasia: {
            name: 'Anastasia Dahl',
            role: 'Dance and performance artist',
            text: 'She works with dance performance and, beyond this medium, is interested in how the particular subtlety of attention trained through dance improvisation can manifest itself in other contexts. She is close to sociology and cultural anthropology. She also leads art mediations in art galleries and curates a community of interdisciplinary artists in Bristol.'
          },
          irhs: {
            name: 'Institute for the Development of Artistic Situations /IDAS/',
            index: 'IDAS',
            role: 'A self-proclaimed independent institute dedicated to the preservation, analysis, and support of artistic situations',
            text: 'IDAS focuses on participatory, process-based, and parafictional practices in contemporary art in Russia and internationally. By an artistic situation, we broadly understand a form of social interaction initiated by an artist or a group of artists, which serves as an alternative to established forms of communication.'
          },
          nadezhda: {
            name: 'Nadezhda Ishkinyaeva',
            role: 'Artist and researcher working at the intersection of visual art and inclusion',
            text: 'In her projects, she uses an interdisciplinary approach, combining academic education with practices of care for artists living in psychoneurological residential institutions. Nadezhda’s work is built around two directions: observing reality, which she records through writing and plein-air practice, and creating educational programmes for city residents.'
          },
          elena: {
            name: 'Elena Kolesnikova',
            role: 'Artist, architect, curator of a home residency',
            text: 'She researches residential spaces and architecture as socially embedded environments. As a curator, she works with the local artistic community, collectively creating horizontal connections and engaging with contexts that are meaningful to them. As an artist, she creates social sculptures, installations, and graphic works.'
          },
          alina: {
            name: 'Alina Kugush',
            role: 'Artist',
            text: 'Her artistic practice is built around the manifestation of inappropriateness, tricksterism, and the acquisition of strength by those who are inherently powerless.'
          },
          noExcuse: {
            name: 'No Excuses',
            index: 'No Excuses',
            role: 'A close-knit team of professionals and an artistic collective',
            text: 'They enjoy life and art, and practise rich leisure, the joy of collectivity, participatory practices, gardening, and cooking dishes made from potatoes.'
          },
          daria: {
            name: 'Daria Orlova',
            role: 'Transdisciplinary artist, performer, and curator. Works with sound and practices of attentive listening',
            text: 'Her artistic, research, and pedagogical work is aimed at reassembling and co-tuning cultural communities and micro-groups in Saint Petersburg through the organisation of sound events — concerts, performances, workshops, lectures, and walks. These practices help create a more inclusive auditory space, strengthening trust and developing a sense of belonging.'
          }
        }
      }
    },
    ja: {
      htmlLang: 'ja',
      meta: {
        title: 'Tarski — 参加型およびソーシャリー・エンゲイジド・アート',
        description: '参加型およびソーシャリー・エンゲイジド・アートの研究と支援。',
        locale: 'ja_JP'
      },
      ui: {
        skip: '本文へ移動',
        header: 'サイトヘッダー',
        mainNav: 'メインナビゲーション',
        mobileNav: '固定モバイルナビゲーション',
        mobilePanel: 'ページ内セクション',
        language: '言語',
        languageNames: {
          ru: 'ロシア語',
          en: '英語',
          ja: '日本語'
        },
        nav: {
          about: 'プロジェクト',
          patrons: 'パトロン・クラブ',
          artists: 'アーティスト',
          mail: 'お問い合わせ'
        },
        scenes: {
          cover: 'メニュー',
          about: '環境',
          patrons: '参加',
          artists: 'ネットワーク'
        },
        themeDark: 'ダークテーマに切り替える',
        themeLight: 'ライトテーマに切り替える',
        serviceOpen: 'サイト設定を開く',
        serviceClose: 'サイト設定を閉じる',
        openDetails: '詳細を開く：',
        closeDetails: '詳細を閉じる',
        links: {
          site: 'ウェブサイト',
          instagram: 'Instagram'
        },
        footerLegal: '裁判所の決定により、Meta Platforms Inc.によるFacebookおよびInstagramのサービス提供に関する活動は、過激主義的活動を理由としてロシア連邦内で禁止されています。'
      },
      superlead: '参加型およびソーシャリー・エンゲイジド・アートの研究と支援',
      about: {
        label: '環境',
        title: '私たちについて',
        lead: '私たちは、アーティストとの協働、教育的な形式、文化的な取り組みを通じて、参加型およびソーシャリー・エンゲイジド・アートの発展のための環境をつくっています。',
        practice: {
          marker: '実践の領域',
          title: '私たちが扱う芸術実践',
          intro: '本プロジェクトが焦点を当てるのは、アーティスト自身によってさまざまに定義される芸術実践です。それらは、次のような近接する概念と関係しています。',
          terms: [
            '参加型アート',
            '参加のアート',
            'ソーシャリー・エンゲイジド・アート',
            '対話型アート',
            '協働的実践',
            '相互作用を基盤とする実践',
            'その他'
          ],
          summary: '実践の文脈',
          context: [
            'こうした芸術実践は、しばしば「参加型」と呼ばれます。それは、参加者が作品の創造プロセスに関わり、共同制作者となる、集団的な行為に基づくアートです。このようなアートは、人々が集まり、連帯と共感をもとに新たなコミュニティを形成する社会的な空間を生み出します。',
            'その特性により、これらの実践の多くは、社会的な文脈の中で展開されます。人々、環境、そして共に生きるためのさまざまなあり方に働きかけるものです。',
            'このようなアートの制作において特徴的なのは、プロセスそのものを成果として捉える姿勢です。重要なのは、作品の形式や最終的な結果だけではありません。制作の過程で生まれ、その後も継続していく関係性の倫理、持続可能性、そして発展もまた重要な要素となります。'
          ]
        },
        focus: {
          marker: 'フォーカス',
          title: 'アプローチとテーマ',
          paragraphs: [
            '私たちは、現代アート、参加、フィランソロピーが交差する地点にある芸術実践に取り組んでいます。そこで扱うのは、社会における人々の生活の質に関わるテーマです。',
            '社会的なつながり、アクセスとインクルージョン、教育と知識の共有、そして生態的・文化的な持続可能性がその中心にあります。',
            '私たちが重視するのは、尊重、ケア、責任に基づく関係のあり方です。',
            'また、アートを参加、対話、共有された経験の空間として捉えています。そこでは、人々は単なる鑑賞者ではなく、起きていることに関わる共参加者となることができます。'
          ]
        },
        mediator: {
          marker: '媒介',
          title: '媒介者としてのTarski',
          intro: [
            '現代アート、アートマーケット、フィランソロピーに関する専門性をもつ私たちは、複雑でプロセスを重視する実践の価値を可視化する方法を知っています。',
            '私たちの役割は、こうしたアートが、オブジェクトから出来事まで、さまざまな形式で存在し、観客やコレクターと出会うための環境をつくることです。'
          ],
          headings: [
            '研究とアーカイブ',
            'コレクション可能な形式の開発',
            '可視性'
          ],
          paragraphs: [
            '私たちは、テキストやリーダーを通じて芸術実践を記録し、記述します。それによって、それらについて語るための言語を形成していきます。同時に、アーティスト、キュレーター、参加者へのインタビューや、彼らの仕事の文脈を明らかにする出版物を通じて、メディア上での発信も展開していきます。',
            '私たちは、市場の論理の中では存在し続けることが難しい芸術実践に取り組み、それらがコレクション可能になるための条件をつくります。たとえば、オブジェクト、ドキュメンテーション、参加の形式、特別版の出版物、その他のフォーマットです。',
            '私たちは、社会志向のアートをめぐる公共的な場を形成し、それを専門家の輪の外にも理解され、見えるものにしていきます。財団の公開プログラムを通じて、こうした実践を観客に紹介し、その周囲に持続的で連帯的なコミュニティを少しずつ育てていきます。'
          ],
          conclusion: 'このように、Tarskiはこのアートの案内役として機能します。芸術実践、専門的な環境、そしてより広い文化的文脈を結びつける存在です。'
        },
        structure: {
          marker: '構成',
          title: 'Tarskiを構成するもの',
          items: [
            ['アドバイザリー・ボード', '文化、教育、ビジネス、メディアの分野で活動する専門家たちが、それぞれの知見、人脈、信頼性を通じてTarskiの発展を支えます。'],
            ['アーティストとの協働', '芸術プロジェクト、リサーチ、レジデンス、そして新しい参加型アートの形式を支援します。'],
            ['パトロン・クラブ', 'Tarskiを財政的に支え、財団の発展に参加するコミュニティです。'],
            ['パブリック・プログラム', 'パートナーとなる文化機関が主催するカンファレンス、フェスティバル、ディスカッション、教育・文化プロジェクトに参加します。'],
            ['パートナーシップ', '文化機関、大学、財団、企業、メディア、そして民間のイニシアチブと協働します。']
          ]
        }
      },
      patrons: {
        label: '参加',
        title: 'Tarski財団 パトロン・クラブ',
        lead: '現代アートに、経験、相互作用、そしてアーティストや専門的なコミュニティとの直接的な接点を通じて参加するためのプログラムです。',
        marker: 'クラブ',
        programmeTitle: '定期プログラム',
        items: [
          ['アーティストのスタジオ訪問', 'アーティストと出会い、彼らのプロジェクトを支援することで、新しいアイデアや形式に取り組む機会を生み出します。'],
          ['作者とのミーティングとクローズドイベント', 'アーティストと出会い、彼らのプロジェクトを支援することで、新しいアイデアや形式に取り組む機会を生み出します。'],
          ['レクチャー、メディエーション、教育的な形式', 'アーティストと出会い、彼らのプロジェクトを支援することで、新しいアイデアや形式に取り組む機会を生み出します。'],
          ['文化機関との特別プロジェクトと協働', 'アーティストと出会い、彼らのプロジェクトを支援することで、新しいアイデアや形式に取り組む機会を生み出します。']
        ],
        final: 'これらの形式は、参加者がただ観察するだけでなく、芸術実践と作品制作のプロセスをより深く理解できるよう設計されています。'
      },
      artists: {
        label: 'ネットワーク',
        title: '志を共有するアーティストたちのネットワーク',
        items: {
          anastasia: {
            name: 'アナスタシア・ダール',
            role: 'ダンス／パフォーマンス・アーティスト',
            text: 'ダンス・パフォーマンスに取り組んでいます。また、このメディウムでの作品制作に加えて、ダンス・インプロヴィゼーションの実践によって養われる繊細な注意のあり方が、他の文脈においてどのように現れるのかに関心を寄せています。社会学や文化人類学とも近い関係にあります。アートギャラリーでのアート・メディエーションを行うほか、ブリストルで学際的なアーティストのコミュニティをキュレーションしています。'
          },
          irhs: {
            name: '芸術的状況発展研究所／IDAS',
            index: 'IDAS',
            role: '芸術的状況の保存、分析、支援に取り組む、自称・独立機関',
            text: 'IDASは、ロシアおよび国際的な現代アートにおける、参加型、プロセス型、パラフィクショナルな実践に焦点を当てています。私たちは「芸術的状況」を、アーティストまたはアーティストのグループによって始められる社会的相互作用の形式として広く捉えています。それは、既存のコミュニケーションの形式に対するオルタナティブとして機能するものです。'
          },
          nadezhda: {
            name: 'ナジェージダ・イシュキニャエワ',
            role: 'ビジュアルアートとインクルージョンの交差点で活動するアーティスト／研究者',
            text: '彼女のプロジェクトでは、学術的な教育と、精神神経系の入所型福祉施設で暮らすアーティストたちへのケアの実践を結びつける、学際的なアプローチが用いられています。ナジェージダの活動は、二つの方向性を中心に展開されています。一つは、現実を観察し、それを文章やプレネールの実践を通じて記録すること。もう一つは、市民のための教育プログラムをつくることです。'
          },
          elena: {
            name: 'エレーナ・コレスニコワ',
            role: 'アーティスト、建築家、ホーム・レジデンスのキュレーター',
            text: '居住空間と建築を、社会的な環境として研究しています。キュレーターとしては、地域のアート・コミュニティと協働し、水平的なつながりを共につくりながら、自分たちにとって意味のある文脈に取り組んでいます。アーティストとしては、ソーシャル・スカルプチャー、インスタレーション、グラフィック作品を制作しています。'
          },
          alina: {
            name: 'アリーナ・クグシュ',
            role: 'アーティスト',
            text: '彼女の芸術実践は、不適切さの表明、トリックスター性、そしてあらかじめ力を持たないとされる者たちが力を獲得していくことをめぐって構成されています。'
          },
          noExcuse: {
            name: 'アーティスティック・コレクティブ「No Excuses」',
            index: 'No Excuses',
            role: '専門家による結束したチームであり、アーティスト・コレクティブ',
            text: '生活とアートを楽しみ、豊かな余暇、集団性の喜び、参加型の実践、ガーデニング、そしてジャガイモ料理づくりを実践しています。'
          },
          daria: {
            name: 'ダリア・オルロワ',
            role: 'トランスディシプリナリー・アーティスト、パフォーマー、キュレーター。音と、注意深く聴く実践に取り組む',
            text: '彼女の芸術、研究、教育に関わる活動は、サンクトペテルブルクの文化的コミュニティやマイクロ・グループを再構成し、共に調律していくことを目指しています。そのために、コンサート、パフォーマンス、ワークショップ、レクチャー、散歩といった音の出来事を企画しています。これらの実践は、よりインクルーシブな聴覚的空間をつくり、信頼を強め、帰属感を育てることに寄与しています。'
          }
        }
      }
    }
  };

  const originalText = new WeakMap();
  const originalMarkup = new WeakMap();
  const originalAttrs = new WeakMap();
  const originalSectionLabels = new WeakMap();
  let currentLanguage = 'ru';

  const getPath = (source, path) => path.split('.').reduce((value, key) => value?.[key], source);
  const getCurrentData = () => translations[currentLanguage] || translations.ru;

  const rememberText = (element) => {
    if (!element || originalText.has(element)) return;
    originalText.set(element, element.textContent);
    originalMarkup.set(element, element.innerHTML);
  };

  const rememberAttr = (element, attr) => {
    if (!element) return;
    const attrs = originalAttrs.get(element) || {};
    if (!(attr in attrs)) {
      attrs[attr] = element.getAttribute(attr);
      originalAttrs.set(element, attrs);
    }
  };

  const setText = (element, value) => {
    if (!element) return;
    rememberText(element);

    if (value === undefined || value === null) {
      element.innerHTML = originalMarkup.get(element);
      return;
    }

    element.textContent = value;
  };

  const setTexts = (elements, values) => {
    Array.from(elements || []).forEach((element, index) => {
      setText(element, Array.isArray(values) ? values[index] : undefined);
    });
  };

  const setAttr = (element, attr, value) => {
    if (!element) return;
    rememberAttr(element, attr);

    if (value === undefined || value === null) {
      const original = originalAttrs.get(element)?.[attr];
      if (original === null || original === undefined) {
        element.removeAttribute(attr);
      } else {
        element.setAttribute(attr, original);
      }
      return;
    }

    element.setAttribute(attr, value);
  };

  const setFooterLegal = (value) => {
    const element = document.querySelector('.site-footer__disclaimer');
    if (!element) return;

    rememberText(element);
    if (value === undefined || value === null) {
      element.innerHTML = originalMarkup.get(element);
      return;
    }

    const text = value.replace(/^\*/, '');
    const mark = document.createElement('sup');
    mark.textContent = '*';
    element.replaceChildren(mark, text);
  };

  const directChildren = (element, selector) => Array
    .from(element?.children || [])
    .filter((child) => child.matches(selector));

  const getBlock = (section, key) => section?.querySelector(`[data-i18n-block="${key}"]`);
  const getItem = (container, key) => container?.querySelector(`[data-i18n-item="${key}"]`);

  const getLocalizedUrl = (language) => {
    const url = new URL(window.location.href);

    if (language === 'ru') {
      url.searchParams.delete('lang');
    } else {
      url.searchParams.set('lang', language);
    }

    return url;
  };

  const getCanonicalUrl = (language) => {
    const url = getLocalizedUrl(language);
    url.hash = '';
    return url.toString();
  };

  const syncUrlLanguage = (language) => {
    try {
      const url = getLocalizedUrl(language);
      if (url.href !== window.location.href) {
        window.history.replaceState(window.history.state, '', url);
      }
    } catch (error) {
      // Language still changes even when History API is unavailable.
    }
  };

  const setIndexedItems = (container, values, keys) => {
    keys.forEach((key, index) => {
      const item = getItem(container, key);
      const value = Array.isArray(values) ? values[index] : values?.[key];

      setText(item?.querySelector('h3'), value?.[0]);
      setText(item?.querySelector('p'), value?.[1]);
    });
  };

  const setMeta = (data) => {
    const ogTitle = data.meta.title.split(' — ')[0];
    const pageUrl = getCanonicalUrl(currentLanguage);

    document.title = data.meta.title;
    document.documentElement.lang = data.htmlLang;
    document.documentElement.dataset.language = currentLanguage;

    document.querySelector('link[rel="canonical"]')?.setAttribute('href', pageUrl);
    document.querySelectorAll('link[rel="alternate"][data-i18n-alternate]').forEach((link) => {
      const language = link.dataset.i18nAlternate === 'x-default' ? 'ru' : link.dataset.i18nAlternate;
      if (supportedLanguages.includes(language)) {
        link.setAttribute('href', getCanonicalUrl(language));
      }
    });
    document.querySelector('meta[name="description"]')?.setAttribute('content', data.meta.description);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', ogTitle);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', data.meta.description);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', pageUrl);
    document.querySelector('meta[property="og:locale"]')?.setAttribute('content', data.meta.locale);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', 'Tarski');
    document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', data.meta.description);
  };

  const setLanguageControls = (data) => {
    document.querySelectorAll('[data-language-switcher]').forEach((switcher) => {
      setAttr(switcher, 'aria-label', data.ui.language);
    });

    document.querySelectorAll('[data-language-option]').forEach((button) => {
      const language = button.dataset.languageOption;
      const isCurrent = language === currentLanguage;
      button.setAttribute('aria-pressed', String(isCurrent));
      setAttr(button, 'aria-label', data.ui.languageNames[language]);
      setAttr(button, 'title', data.ui.languageNames[language]);
    });
  };

  const setInterface = (data) => {
    setText(document.querySelector('.skip-link'), data.ui.skip);
    setAttr(document.querySelector('.site-header'), 'aria-label', data.ui.header);
    setAttr(document.querySelector('.main-nav'), 'aria-label', data.ui.mainNav);
    setAttr(document.querySelector('[data-mobile-menu]'), 'aria-label', data.ui.mobileNav);
    setAttr(document.querySelector('#mobile-menu-panel'), 'aria-label', data.ui.mobilePanel);
    document.querySelectorAll('[data-mobile-service-toggle]').forEach((toggle) => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      const label = isOpen ? data.ui.serviceClose : data.ui.serviceOpen;

      setAttr(toggle, 'aria-label', label);
      setAttr(toggle, 'title', label);
    });

    setText(document.querySelector('.nav-label'), data.ui.scenes[document.documentElement.dataset.scene || 'cover']);
    setTexts(document.querySelectorAll('.main-nav a[href="#about"], .mobile-menu-scroller a[href="#about"]'), [data.ui.nav.about, data.ui.nav.about]);
    setTexts(document.querySelectorAll('.main-nav a[href="#patrons"], .mobile-menu-scroller a[href="#patrons"]'), [data.ui.nav.patrons, data.ui.nav.patrons]);
    setTexts(document.querySelectorAll('.main-nav a[href="#artists"], .mobile-menu-scroller a[href="#artists"]'), [data.ui.nav.artists, data.ui.nav.artists]);
    setText(document.querySelector('.nav-mail'), data.ui.nav.mail);
    setAttr(document.querySelector('.mobile-mail-pill'), 'aria-label', data.ui.nav.mail);
    setAttr(document.querySelector('.mobile-mail-pill'), 'title', data.ui.nav.mail);
    setAttr(document.querySelector('.artist-dossier__scrim'), 'aria-label', data.ui.closeDetails);
    setAttr(document.querySelector('.artist-dossier__close'), 'aria-label', data.ui.closeDetails);
    setFooterLegal(currentLanguage === 'ru' ? undefined : data.ui.footerLegal);
  };

  const setAbout = (data) => {
    const about = data.about || {};
    const practiceData = about.practice || {};
    const focusData = about.focus || {};
    const mediatorData = about.mediator || {};
    const structureData = about.structure || {};

    setText(document.querySelector('.superlead p'), data.superlead);
    setText(document.querySelector('#about .section-intro h1'), about.title);
    setText(document.querySelector('#about .section-intro .lead'), about.lead);

    const aboutSection = document.querySelector('#about');
    const practice = getBlock(aboutSection, 'practice');
    const practiceContent = practice?.querySelector('.editorial-block__content');
    setText(practice?.querySelector('.editorial-block__marker'), practiceData.marker);
    setText(practiceContent?.querySelector('h2'), practiceData.title);
    setText(directChildren(practiceContent, 'p')[0], practiceData.intro);
    setTexts(practiceContent?.querySelectorAll('li'), practiceData.terms);
    setText(practiceContent?.querySelector('summary'), practiceData.summary);
    setTexts(practiceContent?.querySelectorAll('.editorial-disclosure__content p'), practiceData.context);

    const focus = getBlock(aboutSection, 'focus');
    const focusContent = focus?.querySelector('.editorial-block__content');
    setText(focus?.querySelector('.editorial-block__marker'), focusData.marker);
    setText(focusContent?.querySelector('h2'), focusData.title);
    setTexts(directChildren(focusContent, 'p'), focusData.paragraphs);

    const mediator = getBlock(aboutSection, 'mediator');
    const mediatorContent = mediator?.querySelector('.editorial-block__content');
    setText(mediator?.querySelector('.editorial-block__marker'), mediatorData.marker);
    setText(mediatorContent?.querySelector('h2'), mediatorData.title);
    setTexts(directChildren(mediatorContent, 'p:not(.lead-spaced)').slice(0, 2), mediatorData.intro);
    ['research', 'collectibleForms', 'visibility'].forEach((key, index) => {
      const heading = getItem(mediatorContent, key);

      setText(heading, mediatorData.headings?.[index]);
      setText(heading?.nextElementSibling, mediatorData.paragraphs?.[index]);
    });
    setText(mediatorContent?.querySelector('.lead-spaced'), mediatorData.conclusion);

    const structure = getBlock(aboutSection, 'structure');
    const structureContent = structure?.querySelector('.editorial-block__content');
    setText(structure?.querySelector('.editorial-block__marker'), structureData.marker);
    setText(structureContent?.querySelector('h2'), structureData.title);
    setIndexedItems(structureContent, structureData.items, [
      'advisoryBoard',
      'artists',
      'patrons',
      'publicProgrammes',
      'partnerships'
    ]);
  };

  const setPatrons = (data) => {
    const patrons = data.patrons || {};
    const section = document.querySelector('#patrons');
    const block = getBlock(section, 'patrons-programme');
    const content = block?.querySelector('.editorial-block__content');

    setText(section?.querySelector('.section-intro h1'), patrons.title);
    setText(section?.querySelector('.section-intro .lead'), patrons.lead);
    setText(block?.querySelector('.editorial-block__marker'), patrons.marker);
    setText(content?.querySelector('h2'), patrons.programmeTitle);

    setIndexedItems(content, patrons.items, [
      'studioVisits',
      'closedEvents',
      'education',
      'specialProjects'
    ]);

    setText(content?.querySelector('.lead-spaced'), patrons.final);
  };

  const setArtists = (data) => {
    const artists = data.artists || {};
    const items = artists.items || {};

    setText(document.querySelector('#artists-title'), artists.title);

    Object.entries(artistKeys).forEach(([id, key]) => {
      const artist = items[key];
      const card = document.getElementById(id);
      const indexLink = document.querySelector(`.artist-index__link[href="#${id}"]`);
      if (!card) return;

      const displayName = artist?.name;
      setText(indexLink, artist?.index || displayName);
      setAttr(indexLink, 'aria-label', displayName);
      setText(card.querySelector('.artist-card__name'), displayName);
      setText(card.querySelector('.artist-card__role'), artist?.role);
      setText(card.querySelector('.artist-card__body > p:not(.artist-card__role)'), artist?.text);
      setAttr(card.querySelector('.artist-card__image'), 'alt', displayName);
      setAttr(card.querySelector('.artist-card__links'), 'aria-label', displayName ? `${data.ui.nav.artists}: ${displayName}` : undefined);
      setAttr(card.querySelector('.artist-card__link--site'), 'aria-label', displayName ? `${data.ui.links.site}: ${displayName}` : undefined);
      setAttr(card.querySelector('.artist-card__link--instagram'), 'aria-label', displayName ? `${data.ui.links.instagram}: ${displayName}` : undefined);
    });
  };

  const setSectionLabels = (data) => {
    const labels = {
      about: data.about?.label,
      patrons: data.patrons?.label,
      artists: data.artists?.label
    };

    document.querySelectorAll('[data-i18n-section]').forEach((intro) => {
      if (!originalSectionLabels.has(intro)) {
        originalSectionLabels.set(intro, intro.dataset.sectionLabel || '');
      }

      const label = labels[intro.dataset.i18nSection] ?? originalSectionLabels.get(intro);
      if (label) {
        intro.dataset.sectionLabel = label;
      } else {
        delete intro.dataset.sectionLabel;
      }
    });
  };

  const applyLanguage = (language, options = {}) => {
    if (!supportedLanguages.includes(language)) return;

    currentLanguage = language;
    const data = getCurrentData();

    if (options.syncUrl) {
      syncUrlLanguage(language);
    }

    setMeta(data);
    setLanguageControls(data);
    setInterface(data);
    setAbout(language === 'ru' ? {} : data);
    setPatrons(language === 'ru' ? {} : data);
    setArtists(language === 'ru' ? { ui: data.ui } : data);
    setSectionLabels(language === 'ru' ? {} : data);

    if (options.persist) {
      try {
        window.localStorage.setItem(storageKey, language);
      } catch (error) {
        // Language still changes for the current session.
      }
    }

    window.dispatchEvent(new CustomEvent('tarski:languagechange', {
      detail: { language }
    }));
  };

  const getInitialLanguage = () => {
    const queryLanguage = new URLSearchParams(window.location.search).get('lang');
    if (supportedLanguages.includes(queryLanguage)) return queryLanguage;

    try {
      const storedLanguage = window.localStorage.getItem(storageKey);
      if (supportedLanguages.includes(storedLanguage)) return storedLanguage;
    } catch (error) {
      // Fall back to Russian below.
    }

    return 'ru';
  };

  document.querySelectorAll('[data-language-option]').forEach((button) => {
    button.addEventListener('click', () => {
      applyLanguage(button.dataset.languageOption, { persist: true, syncUrl: true });
    });
  });

  window.tarskiI18n = {
    applyLanguage,
    getLanguage: () => currentLanguage,
    getSceneLabels: () => getCurrentData().ui.scenes,
    t: (path) => getPath(getCurrentData(), path) ?? getPath(translations.ru, path)
  };

  applyLanguage(getInitialLanguage(), { syncUrl: true });
})();
