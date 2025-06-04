from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, Item, Location, StockLog
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///inventory.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
CORS(app)
db.init_app(app)

with app.app_context():
    db.create_all()
# 文房具のマスターデータを登録（スマートなカテゴリー分け）
    if not Item.query.first():
        items = [
            Item(code='PEN001', name='ボールペン', category='筆記用具'),
            Item(code='PEN002', name='万年筆', category='筆記用具'),
            Item(code='NOTE001', name='ノート', category='ノート/紙製品'),
            Item(code='ERAS001', name='消しゴム', category='消耗品'),
            Item(code='CLIP001', name='クリップ', category='文具アクセサリ'),
        ]
        db.session.bulk_save_objects(items)
        db.session.commit()
# 拠点マスターデータを登録
    if not Location.query.first():
        locations = [
            Location(name='本社'),
            Location(name='支店A'),
            Location(name='支店B'),
        ]
        db.session.bulk_save_objects(locations)
# 在庫ログマスターデータを登録（各品目に初期在庫20を登録）
    if not StockLog.query.first():
        logs = []
        items_all = Item.query.all()
        locs_all = Location.query.all()
        # 初期在庫として各品目に20を入庫登録
        for item in items_all:
            logs.append(StockLog(item_id=item.id, location_id=locs_all[0].id, type='in', qty=20))
        db.session.bulk_save_objects(logs)
        db.session.commit()

@app.route('/items', methods=['GET'])
def get_items():
    query = request.args.get('query', '')
    category = request.args.get('category')
    location_id = request.args.get('location_id', type=int)
    q = Item.query
    if query:
        q = q.filter((Item.code.contains(query)) | (Item.name.contains(query)))
    if category:
        q = q.filter_by(category=category)
    items = q.all()
    result = []
    for item in items:
        if location_id:
            total_in = db.session.query(db.func.sum(StockLog.qty)).filter_by(item_id=item.id, location_id=location_id, type='in').scalar() or 0
            total_out = db.session.query(db.func.sum(StockLog.qty)).filter_by(item_id=item.id, location_id=location_id, type='out').scalar() or 0
        else:
            total_in = db.session.query(db.func.sum(StockLog.qty)).filter_by(item_id=item.id, type='in').scalar() or 0
            total_out = db.session.query(db.func.sum(StockLog.qty)).filter_by(item_id=item.id, type='out').scalar() or 0
        stock = total_in - total_out
        result.append({
            'id': item.id,
            'code': item.code,
            'name': item.name,
            'category': item.category,
            'stock': stock
        })
    return jsonify(result)

@app.route('/locations', methods=['GET'])
def get_locations():
    locations = Location.query.all()
    return jsonify([{'id': loc.id, 'name': loc.name} for loc in locations])

@app.route('/items', methods=['POST'])
def create_item():
    data = request.get_json() or {}
    code = data.get('code')
    name = data.get('name')
    category = data.get('category')
    if not code or not name:
        return jsonify({'error': 'コードと名前は必須です'}), 400
    if Item.query.filter_by(code=code).first():
        return jsonify({'error': 'コードは既に存在します'}), 400
    item = Item(code=code, name=name, category=category)
    db.session.add(item)
    db.session.commit()
    return jsonify({
        'id': item.id,
        'code': item.code,
        'name': item.name,
        'category': item.category
    }), 201

@app.route('/stock_logs', methods=['POST'])
def create_stock_log():
    data = request.get_json() or {}
    item_id = data.get('item_id')
    location_id = data.get('location_id')
    type_ = data.get('type')
    qty = data.get('qty')
    if type_ not in ['in', 'out']:
        return jsonify({'error': '入出庫種別は"in"または"out"である必要があります'}), 400
    if qty is None or qty <= 0:
        return jsonify({'error': '数量は1以上である必要があります'}), 400
    item = Item.query.get(item_id)
    loc = Location.query.get(location_id)
    if not item or not loc:
        return jsonify({'error': '無効な品目または拠点です'}), 400
    if type_ == 'out':
        total_in = db.session.query(db.func.sum(StockLog.qty)).filter_by(item_id=item_id, location_id=location_id, type='in').scalar() or 0
        total_out = db.session.query(db.func.sum(StockLog.qty)).filter_by(item_id=item_id, location_id=location_id, type='out').scalar() or 0
        if qty > (total_in - total_out):
            return jsonify({'error': '在庫が不足しています'}), 400
    log = StockLog(item_id=item_id, location_id=location_id, type=type_, qty=qty)
    db.session.add(log)
    db.session.commit()
    return jsonify({
        'id': log.id,
        'item_id': log.item_id,
        'location_id': log.location_id,
        'type': log.type,
        'qty': log.qty,
        'date': log.date.isoformat()
    }), 201

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)