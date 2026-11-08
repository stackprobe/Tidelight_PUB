StoryWalkScenario.register({
  "schemaVersion": 1,
  "id": "part_002",
  "title": "岬の帰り灯",
  "steps": [
    {
      "id": "bg_cape",
      "type": "background",
      "background": "lighthouse_dusk"
    },
    {
      "id": "line_001",
      "type": "dialogue",
      "speaker": null,
      "text": "岬へ上る道の落ち枝を払い、灯室の窓を拭くうちに、入江は夕色になった。石垣の灯楼に風が鳴る。"
    },
    {
      "id": "line_001_extra_1",
      "type": "dialogue",
      "speaker": null,
      "text": "握り飯の空の包みが籠に残る。働いた手には、油と松葉の匂いがした。"
    },
    {
      "id": "line_001_extra_2",
      "type": "dialogue",
      "speaker": null,
      "text": "沖に帆が見えた。同じ場所を巡っているようで、岸との距離がつかめない。"
    },
    {
      "id": "mio_arrives",
      "type": "character.show",
      "character": "mio",
      "expression": "smile",
      "position": "left"
    },
    {
      "id": "line_002",
      "type": "dialogue",
      "speaker": "mio",
      "text": "あの船、見える？　潮霧が戻り始めたね。帰り灯が巡れば、港の方角だけは見失わずに済む。"
    },
    {
      "id": "line_002_extra_1",
      "type": "dialogue",
      "speaker": "mio",
      "text": "でも浅瀬までは消せない。道を照らすのが私の仕事で、船を運ぶのは船の人の仕事。"
    },
    {
      "id": "line_002_extra_2",
      "type": "dialogue",
      "speaker": null,
      "text": "灯種箱を抱えるミオは、朝より静かだった。鍵を渡そうとすると、手ごと包むように受け取った。"
    },
    {
      "id": "mio_leaves",
      "type": "character.hide",
      "character": "mio"
    },
    {
      "id": "line_003",
      "type": "dialogue",
      "speaker": null,
      "text": "ミオは灯楼の扉を開けた。上階で歯車がかみ合い、昔の記憶と同じ低い音がする。"
    },
    {
      "id": "line_003_extra_1",
      "type": "dialogue",
      "speaker": null,
      "text": "階段の脇には補助灯。港へ下る道には名札を結んだ小さな提灯が続いていた。"
    },
    {
      "id": "line_003_extra_2",
      "type": "dialogue",
      "speaker": null,
      "text": "上で灯を支えることも、下で帰りを迎えることもできる。沖の帆が、ゆっくり向きを変えた。"
    },
    {
      "id": "end_choice",
      "type": "choice",
      "options": [
        {
          "text": "ミオを追って灯台に上る",
          "next": "part_004"
        },
        {
          "text": "港へ戻って船を迎える",
          "next": "part_005"
        }
      ]
    }
  ]
});
