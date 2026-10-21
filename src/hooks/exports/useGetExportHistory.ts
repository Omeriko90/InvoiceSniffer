import { queries } from "@/queries";
import { useQuery } from "@tanstack/react-query";

const useGetExportHistory = () => {
  return useQuery(queries.exports.list);
};

export default useGetExportHistory;
