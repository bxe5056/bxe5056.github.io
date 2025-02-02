class HtmlTableToJson {
  constructor(html) {
    this.html = html;
  }

  static parse(html) {
    return new HtmlTableToJson(html);
  }

  results() {
    return [[]];
  }
}

export default HtmlTableToJson;
