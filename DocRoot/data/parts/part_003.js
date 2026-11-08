StoryWalkScenario.register({
  "schemaVersion": 1,
  "id": "part_003",
  "title": "石段の刻印",
  "steps": [
    {
      "id": "bg_steps",
      "type": "background",
      "background": "town_morning"
    },
    {
      "id": "line_001",
      "type": "dialogue",
      "speaker": null,
      "text": "乾いた段を下りると、くぼみに星があった。溝の水が淡く光っている。"
    },
    {
      "id": "line_001_extra_1",
      "type": "dialogue",
      "speaker": null,
      "text": "指を伸ばしかけ、苔の滑りやすさに気づいて手帳を出した。星の横には、陸へ向いた短い線がある。"
    },
    {
      "id": "line_001_extra_2",
      "type": "dialogue",
      "speaker": null,
      "text": "波の音が一拍だけ遠のく。背後で草履が止まり、ミオが上段から呼んだ。"
    },
    {
      "id": "mio_returns",
      "type": "character.show",
      "character": "mio",
      "expression": "normal",
      "position": "right"
    },
    {
      "id": "line_002",
      "type": "dialogue",
      "speaker": "mio",
      "text": "それ、潮結び。昔の船着き場の印なんだって。祖父の地図にも、同じ星があるの。"
    },
    {
      "id": "sayo_enters",
      "type": "character.show",
      "character": "sayo",
      "expression": "normal",
      "position": "left"
    },
    {
      "id": "line_002_extra_1",
      "type": "dialogue",
      "speaker": "sayo",
      "text": "光っても近道は開かないよ。溝の貝殻粉が水を含むだけ。足元の縄より先には行かないで。"
    },
    {
      "id": "line_002_extra_2",
      "type": "dialogue",
      "speaker": null,
      "text": "サヨは古い札を外し、縄を張った。星には親しげな目を向けている。"
    },
    {
      "id": "line_003",
      "type": "dialogue",
      "speaker": "mio",
      "text": "潮が戻るね。写しておくなら今のうち。私は上で待つから、終わったら声をかけて。"
    },
    {
      "id": "line_003_extra_1",
      "type": "dialogue",
      "speaker": "sayo",
      "text": "私は札を祠へ戻してくる。読めないところがあったら、あとで帳面を見よう。"
    },
    {
      "id": "line_003_extra_2",
      "type": "dialogue",
      "speaker": "mio",
      "text": "それとも、一緒に岬へ行く？　向こうの支度も、まだ間に合うよ。"
    },
    {
      "id": "end_choice",
      "type": "choice",
      "options": [
        {
          "text": "石段の印を手帳に写す",
          "next": "part_006"
        },
        {
          "text": "ミオと灯台へ行く",
          "next": "part_002"
        }
      ]
    }
  ]
});
