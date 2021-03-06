import './style.styl';
import {
    defineComponent,
    ref,
    reactive,
    getCurrentInstance,
    watch,
    onMounted,
    onBeforeUnmount,
    Transition
} from 'vue';

import IconClose from '@/assets/iconSvg/icon_close.svg';
import MiniLoading from '../mini-loading/MiniLoading';

const Drawer = defineComponent({
    name: 'DDrawer',
    props: {
        /**
		 * 侧拉窗显示状态
		 */
        show: {
            type: Boolean,
            default: false,
            required: true
        },
        /**
		 * 是否聚焦（也就是失去焦点是否关闭侧拉窗）
		 */
        focus: {
            type: Boolean,
            default: false
        },
        /**
		 * 是否固定底部操作栏
		 */
        bottom: {
            type: Boolean,
            default: false
        },
        // 加载更多
        loadingMore: {
            type: Boolean,
            default: false
        },
        // 加载中...
        loading: {
            type: Boolean,
            default: false
        },
        // 弹窗距离顶部距离是多少
        top: {
            type: [String, Number],
            default: ''
        },
        // 当前组件的id，具有唯一性
        componentId: {
            type: String,
            default: ''
        },
        onClose: {
            type: Function,
            default: () => {}
        },
        onGetMore: {
            type: Function,
            default: () => {}
        }
    },
    setup(props, { emit, slots }) {
        const state = reactive({
            autoClose: false, // 是否失去焦点就关闭
            scrollTop: 0, // 滚动条的位置
            tabIndex: -1,
            clientWidth: 0, // drawerBox宽
            clientHeight: 0 //
        });

        const drawerBox = ref(null);
        const { proxy }: any = getCurrentInstance();

        watch(
            () => props.focus,
            (n, o) => {
                if (n === o) return;
                state.autoClose = n;
            },
            { immediate: true }
        );

        // 关闭侧拉窗
        const onClose = (): void => {
            emit('close', false);
        };

        // 检查点击区域
        const checkPointer = (e: MouseEvent): void => {
            const { focus, show } = props;
            if (!focus || !show) return;
            if (!proxy.$el.contains(e.target)) onClose();
        };

        onMounted(() => {
            window.addEventListener('click', checkPointer, true);
        });
        onBeforeUnmount(() => {
            window.removeEventListener('click', checkPointer);
        });

        // 监听页面触底
        const contentScroll = (e: UIEvent) => {
            if (props.loadingMore) return;
            const target = e.target as HTMLDivElement;
            const { scrollTop, scrollHeight } = target;
            const h = target.getBoundingClientRect().height;
            if (scrollTop + h === scrollHeight) {
                // 触底了
                emit('getMore');
            }
        };

        return () => {
            const { show, top, componentId, bottom, loadingMore, loading } = props;

            return (
                <Transition name="slideRightLeft">
                    <div v-show={show} class="d-drawer-box">
                        <div
                            ref={drawerBox}
                            class="d-drawer"
                            style={{ top: `${top}px`, height: `calc(100% - ${top}px)` }}
                        >
                            <div class="d-drawer-title">
                                <section class="d-drawer-title-content">{slots?.title()}</section>
                                <i class="d-drawer-title-icon" onClick={onClose}>
                                    <IconClose />
                                </i>
                            </div>
                            <div
                                id={componentId}
                                class={['d-drawer-content', bottom && 'd-drawer-content-bottom']}
                                onScroll={contentScroll}
                            >
                                {slots?.content()}
                                {loadingMore && (
                                    <section class="d-drawer-content-loading">
                                        <MiniLoading class="d-loading16px-drawer" />
                                        <span>加载中...</span>
                                    </section>
                                )}
                            </div>
                            {slots.handle && (
                                <div
                                    class={['d-drawer-handle', bottom && 'd-drawer-handle-bottom']}
                                >
                                    {slots.handle()}
                                </div>
                            )}
                            {loading && (
                                <div class="d-drawer-loading">
                                    <section class="d-drawer-loading-svg">
                                        <MiniLoading color="#c3c7cb" />
                                    </section>
                                </div>
                            )}
                        </div>
                    </div>
                </Transition>
            );
        };
    }
});

export default Drawer;
