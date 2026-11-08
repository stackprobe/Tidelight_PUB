StoryWalkScenario.register({
  "schemaVersion": 1,
  "id": "part_001",
  "title": "霧の朝",
  "steps": [
    {
      "id": "bg_start",
      "type": "background",
      "background": "town_morning"
    },
    {
      "id": "line_001",
      "type": "dialogue",
      "speaker": null,
      "text": "朝霧の港で、鳴子綱がひとつ鳴った。瓦屋根の向こうは白く、石段の下だけが潮を返して光っている。"
    },
    {
      "id": "line_001_extra_1",
      "type": "dialogue",
      "speaker": null,
      "text": "昨日戻ったばかりの町は、炊いた米と潮の匂いがした。聞き覚えのある足音に振り向く。"
    },
    {
      "id": "mio_enters",
      "type": "character.show",
      "character": "mio",
      "expression": "normal",
      "position": "right"
    },
    {
      "id": "line_002",
      "type": "dialogue",
      "speaker": "mio",
      "text": "おかえり。昨日は会えなかったね。ねえ、岬まで来ない？　今夜、初めて私が灯台の主当番なの。"
    },
    {
      "id": "line_002_extra_1",
      "type": "dialogue",
      "speaker": null,
      "text": "腰の真鍮の鍵を握る指が、少し硬い。頼もしくなった、と言いかけると、ミオは先に笑った。"
    },
    {
      "id": "line_002_extra_2",
      "type": "dialogue",
      "speaker": "mio",
      "text": "祖父は町にいるよ。でも今日は、なるべく自分の手でやりたい。支度、一緒にしてくれる？"
    },
    {
      "id": "mio_smiles",
      "type": "character.expression",
      "character": "mio",
      "expression": "smile"
    },
    {
      "id": "sayo_enters",
      "type": "character.show",
      "character": "sayo",
      "expression": "normal",
      "position": "left"
    },
    {
      "id": "line_003",
      "type": "dialogue",
      "speaker": "sayo",
      "text": "灯種をお届け。箱は傾けないでね、ミオ。火も寝起きは機嫌が悪いから。"
    },
    {
      "id": "line_003_extra_1",
      "type": "dialogue",
      "speaker": null,
      "text": "祠のサヨが蓋付きの箱を渡した。継ぎ目から、朝日とは違う薄金の光がこぼれる。"
    },
    {
      "id": "line_003_extra_2",
      "type": "dialogue",
      "speaker": "mio",
      "text": "石段が気になるなら、先に見てもいいよ。潮の戻る前に、乾いた所へ上がってね。"
    },
    {
      "id": "end_choice",
      "type": "choice",
      "options": [
        {
          "text": "ミオと岬へ向かう",
          "next": "part_002"
        },
        {
          "text": "港の古い石段を調べる",
          "next": "part_003"
        }
      ]
    }
  ]
});
