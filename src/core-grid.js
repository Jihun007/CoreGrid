
//생성자 함수
class GridCore  {
	
	//초기 세팅
	constructor(options){
		
		// *그리드를 그릴 id
		this.selector = options.selector || '';
		
		// *데이터 호출 url
		this.url = options.url || '';

		/*
		 * *columns 지정 예시
		 * columns : [
			{ label : 'th 제목에 보일 값', 
			  field : '데이터 추출 변수', 
			  sortField : 'DB에서 정렬할 컬럼명'
			  , align : '텍스트 정렬'
			  , width : '열 너비'},
		]
		1. label, field 필수
			1) label : th 값 및 td data-label에 활용
			2) field : td 값에 활용
		2. align, width 선택
			1) align 기본 'tc'(tl, tr, tc)
			2) width 기본 'auto'
		 * */
		this.columns = options.columns || [];
		
		// 목록 title
		this.title = options.title || '목록';
		
		// 파라미터
		this.param = options.param || {};
		
		// pageMode(0 : 이전 및 다음, 1 : 처음 및 마지막)
		this.pageMode = options.pageMode || 1;
		
		// pageSizeList(설정 안할 경우 기본 10개)
		this.pageSizeList = options.pageSizeList || [];
		
		//디버그 모드
		this.debug = options.debug || false;
		
		//디버그 모드
		
		//정렬 필드
		this.sortField = '';
		
		// 정렬순
		this.sortOrder = '';

		this.csrf = this._detectCSRF();
		
		// 초기 실행 함수
		this.init();
	}
	
	/**
     * meta 태그에서 CSRF 감지
     */
	_detectCSRF(){
		try {
			const token = $("meta[name='_csrf").attr("content");
			const header = $("meta[name='_csrf_header").attr("content");
		
			//csrf가 있다면 설정
			if(token && token.trim() && header && header.trim()){
				
				if(this.debug){
					console.info("GridCodr : CSRF token auto-detected", {header: header, token: token})
				}
				
				return {token: token, header: header};
			}
		
		} catch (e) {
			console.warn("GridCore : CSRF detection failed", e);
		}
		if(this.debug) console.info("GridCore : CSRF not available (this is normal for non-Spring Security projects");
		return null;
	}
	
	/**
     * 초기화
     */
	init(){
		if(this.debug) console.info(`GridCore : Initializing #${this.selector}`);
		
		//필수 입력 점검
		if(!this.selector){
			console.error("GridCore : selector is required");
			return;
		}
		
		if($(`#${this.selector}`).length === 0){
			console.error(`GridCore : Element #${this.selector} not found in DOM`);
			return;
		}
		
		if(!this.url){
			console.error("GridCore : url is required");
			return;
		}
		
		if(!this.columns || this.columns.length === 0){
			console.error("GridCore : columns array is empty or undefined");
			return;
		}
		
		this.columns.forEach((col, idx) => {
			if(!col.label || !col.field){
				console.warn(`GridCore : Column[${idx}] missing label or field`, col);
			}
		});
		
		if(this.debug){
			console.info("GridCore : Configuration", {
				url: this.url,
				title: this.title,
				columns: this.columns.length,
				pageMode: this.pageMode,
				pageSizeList: this.pageSizeList,
				params: this.param
			});
		}
		
		//초기 레이아웃
		this.createLayout();
		
		//이벤트 바인드
		this.bindEvents();
		
		//페이지 1 list 조회
		this.getList(1);
	}
	
	/**
     * 전반적인 레이아웃 생성
     */
	createLayout(){
		
		let html = '';
		
		//제목
		html += `<h3 class="detail_tit">${this.title}</h3>`;
		
		// 검색 건수 & 페이지 사이즈
		html += '<div class="tit-way">';
		html += '	<strong class="search-number"></strong>';
		if(this.pageSizeList && this.pageSizeList.length !== 0){
			html += '	<div class="button-box">';
			html += '		<ul>';
			html += '			<li>';
			html += '				<span class="select">';
			html += '					<label for="pageSize" class="hide">페이지건수</label>';
			html += '					<select class="pageSize" name="pageSize" class="w100 han e">';
			$.each(this.pageSizeList, (dix, pageSize) => {
				if(dix === 0){
					html += `<option value="${pageSize}" selected>${pageSize}</option>`;
				}else{
					html += `<option value="${pageSize}">${pageSize}</option>`;
				}
			});
			html += '					</select>';
			html += '				</span>';
			html += '			</li>';
			html += '		</ul>';
			html += '	</div>';
		}
		
		html += '</div>';
		
		// 테이블
		html += '<div class="table-wrapper">';
		html += '<table>';
		
		//thead, tbody는 drawTble에서 생성
		html += '</table>';
		html += '</div>';
		
		// 페이징
		html += '<div class="pagination_wrap">';
		html += '	<div class="pagination_area"></div>';
		html += '</div>';
		
		if(this.debug) console.info("GridCore : Layout created");
		
		$(`#${this.selector}`).html(html);
		
	}
	
	/**
     * 이벤트 바인딩
     */
	bindEvents(){
		
		if(this.debug) console.info("GridCore : Events bound");
		//페이지 사이즈 변경
		$(`#${this.selector} .pageSize`).on("change", () => {
			
			if(this.debug) {
				const newSize = $(`#${this.selector} .pageSize`).val();
				console.info(`GridCore : Page size changed to ${newSize}`);
			}
			
			this.getList(1);
		});
		
		//페이징
		$(document).on('click', `#${this.selector} .pagination_area a`, (e) => {
			e.preventDefault();
			const page = $(e.currentTarget).attr('href');
			if(this.debug) console.info(`GridCore : Navigate to page ${page}`);
			this.getList(page);
		});
		
		//정렬
		$(document).on('click', `#${this.selector} .sortable`, (e) => {
			
			//th data에서 정렬 조건 추출
			const sortField = $(e.currentTarget).data('sort-field');
			let sortOrder = $(e.currentTarget).data('sort-order') || 'ASC';
			
			//기존 정렬과 같다면 방향만 변경
			if(this.sortField === sortField){
				sortOrder = this.sortOrder === 'ASC' ? 'DESC' : this.sortOrder === 'DESC' ? '' : 'ASC';
			}else{
				sortOrder = 'ASC';
			}
			
			this.sortField = sortOrder === '' ? '' : sortField;
			this.sortOrder = sortOrder;
			
			//class 수정
			$(`#${this.selector} th .sortable`).removeClass('asc desc');
			if(sortOrder !== ''){
				$(e.currentTarget).addClass(sortOrder.toLowerCase());
			}
			
			if(this.debug) console.info(`GridCore : Sort by ${sortField} ${sortOrder}`);
			
			this.getList(1)
		});
	
	}
	
	/**
     * 리스트 조회하기
     */
	getList(page){
		
		const pageSize = parseInt($(`#${this.selector} .pageSize`).val()) || 10;
		const pageMode = this.pageMode;
		const url = this.url;
		const param = this.param;
		const sortField = this.sortField || '';
		const sortOrder = this.sortOrder || '';
		
		//반드시 필요(pageNumber)
		param["pageNumber"] = page;
		param["pageSize"] = pageSize;
		param["sortField"] = sortField;
		param["sortOrder"] = sortOrder;
		
		if(this.debug){
			console.info("GridCore : Fetching data", {
				url: url,
				page: page,
				pageSize: pageSize,
				param: param,
				sortField: sortField,
				sortOrder: sortOrder
			});
		}
		
		if(this.csrf){
			
		}
		
		const self = this;
		
		//ajax 통신
		$.ajax({
			url : url
			, type:"POST"
			, dataType:"json"
			, data : param
			, beforeSend : function(xhr){
				if(self.csrf){
					xhr.setRequestHeader(self.csrf.header, self.csrf.token);
					if(self.debug) console.info(`GridCore : CSRF header set (${self.csrf.header})`);
				}
			}
			, success: function(response){
				
				if(self.debug){
					console.info("GridCore : Response received", {
						result: response.result,
						totalCount: response.totalCount,
						listLength: response.list ? response.list.length : 0
					});
				}
				
				if(response.result == "success"){
					response["currentPage"] = parseInt(page);
					response["pageSize"] = parseInt(pageSize);
					response["pageMode"] = pageMode;
					
					self.updateCount(response.totalCount);
					self.drawTable(response.list);
					self.drawPagination(response);
					
					if(self.debug) console.info("GridCore : Data rendered successfully");
				}else{
					console.warn("GridCore : Server returned non-success result", response);
				}
				
			}
			, error : function(xhr, status, error){
				console.error("GridCore : AJAX request failed", {
					status: xhr.status,
					statusText: xhr.statusText,
					error: error
				});
				
				if(self.debug) console.error("GridCore : Response details", xhr.responseText);
				
				if(xhr.status === 404){
					console.warn("GridCore : 404 - Check if API URL is correct");
				} else if(xhr.status === 403){
					console.warn("GridCore : 403 - Check CSRF token or authentication");
				} else if(xhr.status === 500){
					console.warn("GridCore : 500 - Server error, check server logs");
				} else if(xhr.status === 0){
					console.warn("GridCore : Network error or CORS issue");
				}
				
				alert("Failed to load data");
			}
			
		});
		
	}
	
	/**
     * 총 건수 업데이트
     */
	updateCount(totalCount){
		
		if(this.debug) console.info(`GridCore : Total count updated to ${totalCount}`);
		
		$(`#${this.selector} .search-number`).html(
			`총 <strong style="color: red;">${totalCount.toLocaleString()}</strong>건이 검색되었습니다.`
		);
	}
	
	/**
     * 그리드 그리기
     */
	drawTable(list){
		
		if(this.debug){
			console.info("GridCore : Drawing table", {
				dataLength: list ? list.length : 0,
				isEmpty: !list || list.length === 0
			});
		}
		
		// 데이터 검증
		if(list && !Array.isArray(list)){
			console.error("GridCore : list is not an array", typeof list);
			return;
		}
		
		// 첫 번째 데이터와 컬럼 매칭 확인
		if(this.debug && list && list.length > 0){
			console.info("GridCore : First row sample", list[0]);
			
			const missingFields = [];
			this.columns.forEach(col => {
				if(!(col.field in list[0])){
					missingFields.push(col.field);
				}
			});
			
			if(missingFields.length > 0){
				console.warn("GridCore : Some column fields not found in data", {
					missingFields: missingFields,
					availableFields: Object.keys(list[0])
				});
			}
		}
		
		const $table = $(`#${this.selector} table`);
		
		let html = '';
		
		//colgroup
		html += '<colgroup>';
		$.each(this.columns, (dix, col) => {
			const width = col.width || 'auto';
			html += `<col style="width:${width}" >`;
		});
		html += '</colgroup>';
		
		//thead
		html += '<thead><tr>';
		$.each(this.columns, (idx, column) => {
			const sort = column.sortField === this.sortField ? this.sortOrder : '';
			if(column.sortField){
				html += `<th class="sortable ${sort}" data-sort-field="${column.sortField}" data-sort-order="${sort}">${column.label}</th>`;
				
			}else{
				html += `<th>${column.label}</th>`;
				
			}
		});
		html += '</tr></thead>';
		
		//tbody
		html += '<tbody>';
		if(!list || list.length === 0){
			html += `<tr><td colspan="${this.columns.length}" class="tc">조회된 데이터가 없습니다.</td></tr>`;
		}else {
			$.each(list, (idx, item) => {
				html += '<tr>';
				$.each(this.columns, (colIdx, column) => {
					const value = item[column.field] || '-';
					const align = column.align || 'tc';
					html += `<td data-label="${column.label}" class="${align}">${value}</td>`;
				});
				html += '</tr>';
			});
		}
		
		html += '</tbody>';
		
		$table.html(html);
		
		if(this.debug) console.info('GridCore : Table rendered');
		
	}
	
	/**
     * 페이징 그리기
     */
	drawPagination(data){
		const totalPage = Math.ceil(data.totalCount / data.pageSize);
		const currentPage = data.currentPage;
		const pageGroupSize = 10;
		
		const startPage = Math.floor((currentPage - 1) / pageGroupSize) * pageGroupSize + 1;
		const endPage = Math.min(startPage + pageGroupSize - 1, totalPage);
		
		const pageMode = data.pageMode;
		
		if(this.debug){
			console.info("GridCore : Pagination info", {
				totalPage: totalPage,
				currentPage: currentPage,
				pageRange: `${startPage}-${endPage}`
			});
		}
		
		let html = '';
		
		// 처음
		if(pageMode == 1){
			if(startPage != 1){
				html += '<a class="first_page" href="1" title="첫 페이지로 이동합니다."><span class="hide">첫페이지</span></a>';
			}
		}
		
		// 이전
		if(startPage != 1){
			html += `<a class="prev_page" href="${startPage - 1}" title="이전 페이지로 이동합니다."><span class="hide">이전</span></a>`;
		}
		
		// 페이지 번호
		for(let i = startPage; i <= endPage; i++){
			if(i === currentPage){
				html += `<a href="${i}" class="pagin_on" title="${i}페이지 이동"><span>${i}</span></a>`;
			} else {
				html += `<a href="${i}" title="${i} 페이지로 이동합니다.">${i}</a>`;
			}
		}
		
		// 다음
		if(endPage < totalPage){
			html += `<a class="next_page" href="${endPage + 1}" title="다음 페이지로 이동합니다."><span class="hide">다음</span></a>`;
		}
		
		// 마지막
		if(pageMode == 1){
			if(endPage < totalPage){
				html += `<a class="last_page" href="${totalPage}" title="마지막 페이지로 이동합니다."><span class="hide">끝페이지로</span></a>`;
			}
		}
		
		$(`#${this.selector} .pagination_area`).html(html);
		
		if(this.debug) console.info("GridCore : Pagination rendered");
	}
}
