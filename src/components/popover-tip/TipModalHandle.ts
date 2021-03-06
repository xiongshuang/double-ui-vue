import { VNode, Ref, createVNode, render, isRef } from 'vue';
import GetScrollbarWidth from '@/utils/GetScrollbarWidth';

import TipModal from './TipModal';

export interface Instance {
	vm: VNode;
	tag: Ref<HTMLElement> | HTMLElement;
	countTag: Ref<HTMLElement> | HTMLElement;
	setContent(content: string): void;
	setShow(show: boolean): void;
	resetPosition(): void;
	remove(): void;
}

// 获取popoverTip宽高
const CountWh = (vm: VNode) => {
    const { content, split } = vm.component.props;
    const contentArr = ((isRef(content) ? content.value : content) as string).split('、');

    const { body } = document;
    const element = document.createElement('div');
    element.className = 'd-popover-tip';
    element.style.left = '0';
    element.style.bottom = '0';
    element.style.opacity = '0';
    element.style.zIndex = '-100';
    let html = '<section class="d-popover-tip-content">';
    if (split) {
        contentArr.forEach((d) => {
            html += `<article class="d-popover-tip-content-item"><span class="d-popover-tip-item-text">${d}</span></article>`;
        });
    } else {
        html += `<article class="d-popover-tip-content-words">${content}</article>`;
    }
    html += '</section>';
    element.innerHTML = html;

    body.appendChild(element);
    const { width, height } = element.getBoundingClientRect();
    body.removeChild(element);
    const scrollWidth = GetScrollbarWidth();

    return { width, height, scrollWidth };
};

// 创建内容，获取每项内容宽度
const createArticle = (str: string) => {
    const article = document.createElement('article');
    article.className = 'd-popover-tip-content-item';
    article.style.display = 'inline-block';
    article.style.height = '0';
    article.style.opacity = '0';
    article.innerHTML = `<span class="d-popover-tip-item-text">${str}</span>`;
    document.body.appendChild(article);
    const w = article.clientWidth + 4;
    document.body.removeChild(article);
    return w;
};
// split=true 计算内容宽度
const countContentWidth = (vm: VNode) => {
    const {
        component: {
            props: { content }
        }
    } = vm;
    const contentArr = ((isRef(content) ? content.value : content) as string).split('、');
    const numArr = [];
    const len = contentArr.length;
    let num = 0;
    for (let i = 0; i < len; i++) {
        const iw = createArticle(contentArr[i]);
        num += iw;
        if (num > 468) {
            numArr.push(num - iw);
            if (i === len - 1) numArr.push(num);
            else num = iw;
        } else if (num === 468) {
            return 468;
        }
    }
    return numArr && numArr.length ? Math.max(...numArr) : num;
};

// 计算位置
const CalcPopoverTipPosition = (triggerDom: HTMLElement, targetHeight: number) => {
    const { clientHeight } = document.body; // 当前触发器父级的宽高
    const { pageYOffset } = window; // 基于window对象滚动的距离
    const { top, height } = triggerDom.getBoundingClientRect(); // 根据当前点击的dom对象获取位置
    let targetOffsetY;
    let P = true; // 动画执行方向 - 默认向下

    // 1.计算top位置
    const triggerPositionTop = top - 8; // 触发器距离顶部的距离
    const triggerPositionBtm = clientHeight - (top + height + 8); // 触发器距离底部的距离
    if (triggerPositionTop >= targetHeight) {
        // 触发器距离顶部的距离 大于等于 目标元素高度，下拉列表向上弹出
        targetOffsetY = triggerPositionTop - targetHeight + pageYOffset;
        P = false;
    } else if (triggerPositionBtm >= targetHeight) {
        // 触发器距离底部的距离 大于等于 目标元素高度，下拉列表向下弹出
        targetOffsetY = top + height + 8 + pageYOffset;
    } else {
        // 上下都不满足条件，位置距离页面底部为0
        // 下拉列表向下弹出
        targetOffsetY = clientHeight - targetHeight + pageYOffset;
    }

    // Y-top位置，P-动画执行方向
    return { Y: targetOffsetY, P };
};

const resetPosition = (instance: Instance) => {
    const { vm, tag, countTag } = instance;
    const isr = isRef(vm.component.props.content);
    if (!(isr ? (vm.component.props.content as Ref<string>).value : vm.component.props.content)) { return; }
    const { innerWidth, pageXOffset } = window;
    const tagEle = isRef(tag) ? tag.value : tag;
    const countTagEle = isRef(countTag) ? countTag.value : countTag;
    // 触发器位置参数
    const { left: tagLeft, width: tagWidth } = tagEle.getBoundingClientRect();
    // 数字位置参数
    const { left: cLeft, width: cWidth } = countTagEle.getBoundingClientRect();

    // 当数字被浏览器遮挡就不在弹窗popover
    if (innerWidth <= cLeft + cWidth / 2 || innerWidth <= cWidth || cLeft < 0) return;
    // 获取popover的宽高
    const { width, height, scrollWidth } = CountWh(vm);
    // 计算popover位置
    const { Y, P } = CalcPopoverTipPosition(tagEle, height);
    if (vm.component.props.split) {
        // 设置最大宽度
        const maxWidth = countContentWidth(vm) + 13;
        vm.el.style.maxWidth = `${maxWidth}px`;
    }
    vm.component.props.position = P;
    // 设置popover位置
    vm.el.style.top = `${Y}px`;
    const triangle = vm.el.lastChild;
    let popoverLeft = 0;
    let triangleLeft;
    if (width === innerWidth) {
        // popover的宽度等于window宽度
        if (pageXOffset > 0) popoverLeft = 0;
        triangleLeft = cLeft + cWidth / 2 - 6;
    } else {
        // popover的宽度小于window宽度
        if (tagLeft === 0) {
            popoverLeft = 0;
        } else {
            const discoverWidth = innerWidth - tagLeft; // 触发器显示出来的宽度
            const centerPlace = cLeft + cWidth / 2; // 数字中心位置
            const popoverLeftWidth = width / 2; // popover中心左边宽度
            if (centerPlace < popoverLeftWidth) {
                popoverLeft = 0;
            } else if (width <= tagWidth) {
                // popover的宽度小于等于触发器宽度
                if (width <= discoverWidth) popoverLeft = centerPlace - popoverLeftWidth;
                else popoverLeft = innerWidth - width;
            } else {
                // popover的宽度大于触发器宽度
                // eslint-disable-next-line no-lonely-if
                if (centerPlace >= popoverLeftWidth) {
                    // 右边剩下的宽度小于等于popover一半的宽度
                    if (innerWidth - centerPlace <= popoverLeftWidth) { popoverLeft = innerWidth - width - scrollWidth; } else popoverLeft = centerPlace - popoverLeftWidth;
                } else {
                    popoverLeft = 0;
                }
            }
        }
        triangleLeft = cLeft - popoverLeft + cWidth / 2 - 6;
    }
    vm.el.style.left = `${popoverLeft + pageXOffset}px`;
    triangle.style.left = `${triangleLeft}px`;
    instance.setShow(true);
};

interface Props {
	tag: HTMLElement;
	countTag: HTMLElement;
	content: string | Ref<string>;
	split: boolean;
	dropShow: boolean;
}
interface Options {
	tipShow: boolean;
	props: Props;
	changeTipShow(status: boolean): void;
	tipHandle(str: string): void;
}

let dom: HTMLDivElement;
const TipModalHandle = (options: Options): Instance => {
    const { tipShow, props, changeTipShow, tipHandle } = options;
    const { tag, countTag } = props;
    if (!dom) {
        dom = document.createElement('div');
        document.body.appendChild(dom);
    }
    const vm: VNode = createVNode(TipModal, { tipShow, ...props, changeTipShow, tipHandle }); // 实例化

    const instance: Instance = {
        vm,
        tag,
        countTag,
        setContent(content: string) {
            vm.component.props.content = content;
        },
        setShow: changeTipShow,
        resetPosition() {
            resetPosition(instance);
        },
        remove() {
            if (vm.component.isUnmounted) return;
            render(null, dom);
            // document.body.removeChild(dom);
        }
    };
    render(vm, dom);
    return instance;
};

export default TipModalHandle;
