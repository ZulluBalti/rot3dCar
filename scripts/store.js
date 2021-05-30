export default {
  nxtA: 3,
  prevA: 0,
  orientation: "horizontal",
  toggleOrientation() {
    this.orientation =
      this.orientation === "horizontal" ? "vertical" : "horizontal";
  },
  currentObjs: [0, 1, 2, 3],
  removeOne(index) {
    this.currentObjs.splice(index, 1);
  },
  cNext() {
    this.nxtA++;
    if (this.nxtA >= this.models.length) this.nxtA = 0;

    while (this.currentObjs.includes(this.nxtA)) {
      let nNum = Math.max(...this.currentObjs) + 1;
      if (nNum >= this.models.length) nNum = 0;
      this.nxtA = nNum;
    }
    this.currentObjs.push(this.nxtA);
  },

  cPrev() {
    this.prevA--;
    if (this.prevA < 0) this.prevA = this.models.length - 1;

    while (this.currentObjs.includes(this.prevA)) {
      let nNum = Math.min(...this.currentObjs) - 1;
      if (nNum < 0) nNum = this.models.length - 1;
      this.prevA = nNum;
    }
    this.currentObjs.push(this.prevA);
  },

  models: [
    {
      file: "assets/models/apple/applewatchattachment.glb",
      oR: { x: 1.8, y: Math.PI, z: 0 },
      oS: { x: 7, y: 7, z: 7 },
    },
    {
      file: "assets/models/cd/CDX.glb",
      oR: { x: Math.PI / 2, y: 0, z: 0 },
      oS: { x: 100, y: 100, z: 100 },
    },
    {
      file: "assets/models/fiji/fijji.glb",
      oR: { x: Math.PI / 2, y: 0, z: 0 },
      oS: { x: 0.5, y: 0.5, z: 0.5 },
      oPy: -130,
    },
    {
      file: "assets/models/flower/flowerearring.glb",
      oR: { x: 0.6, y: 0, z: 0 },
      oS: { x: 12, y: 12, z: 12 },
      oPy: -90,
    },
    {
      file: "assets/models/grindPlate/grind_plate.glb",
      oR: { x: 1.2, y: 0, z: 0 },
      oS: { x: 4, y: 4, z: 4 },
      oPy: 160,
    },
    {
      file: "assets/models/grindShoe/grind_shoe.glb",
      oR: { x: 2, y: 0, z: 0 },
      oS: { x: 12, y: 12, z: 12 },
    },
    {
      file: "assets/models/lock/LOVE_HATE_LOVE.glb",
      oR: { x: 0, y: 0, z: 0 },
      oS: { x: 4, y: 4, z: 4 },
      oPy: -95,
    },
    {
      file: "assets/models/mechanicalTool/scene.glb",
      oR: { x: 0.5, y: 0, z: 0 },
      oS: { x: 0.8, y: 0.8, z: 0.8 },
      oPy: 50,
    },
    {
      file: "assets/models/modernTable/Modern_Table.glb",
      oR: { x: 0.4, y: 0, z: 0 },
      oS: { x: 20, y: 20, z: 20 },
      oPy: -35,
    },
    {
      file: "assets/models/musicalBall/MUSIC_BALL.glb",
      oR: { x: 0, y: 0, z: 0 },
      oS: { x: 60, y: 60, z: 60 },
    },
    {
      file: "assets/models/stepByStep/Improved Step by Step.glb",
      oR: { x: 0.4, y: 0, z: 0 },
      oS: { x: 10, y: 10, z: 10 },
    },
    {
      file: "assets/models/vernoidCube/Vernoid Cube.glb",
     oR: { x: 0.5, y: 2.3, z: 0 },
      oS: { x: 4, y: 4, z: 4 },
    },
    {
      file: "assets/models/waterDrop/WaterDrops.glb",
      oR: { x: 0.8, y: 0, z: 2.1 },
      oS: { x: 12, y: 12, z: 12 },
    },
    {
      file: "assets/models/weddingBand/Wedding Band.glb",
      oR: { x: 1.3, y: 0, z: 0 },
      oS: { x: 4, y: 4, z: 4 },
      color: 0xffff00,
      oPy: -35,
    },
  ],
};
