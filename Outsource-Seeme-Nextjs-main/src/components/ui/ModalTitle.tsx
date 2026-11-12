type ModalTitleProps = {
    title: string;
    id?: string;
};

const ModalTitle = ({title, id}: ModalTitleProps) => {
    return (
        <h2 id={id} className="text-center text-2xl font-medium text-[#3b5518] font-source-serif-4 mb-5">
            {title}
        </h2>
    );
};

export default ModalTitle;
