import  mongobless from  '../..';

@mongobless({collection: 'pieces'})
export class Piece{
  static bless(obj){
    switch(obj.type){
      case 'square':
        return mongobless.bless.bind(Square)(obj);
      case 'circle':
        return mongobless.bless.bind(Circle)(obj);
      default:
        return mongobless.bless.bind(Piece)(obj);
    }
  }
}

@mongobless()
export class Square{
  get surface(){
    return this.size * this.size;
  }
    
  constructor(size){
    this.size = size;
    this.type = 'square';
  }
}

@mongobless()
export class Circle{
  get surface(){
    //return Math.PI * Math.pow(this.radius, 2);
    return 3 * Math.pow(this.radius, 2);
  }

  constructor(radius){
    this.radius = radius;
    this.type = 'circle';
  }
}
